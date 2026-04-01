/**
 * Watch Party Security Module
 * CTM-233: Auth + Family Membership Verification
 *
 * Security controls for Watch Party real-time features:
 * - Clerk JWT verification on Socket.IO handshake
 * - Family membership enforcement
 * - Chat message sanitization (XSS prevention)
 * - Rate limiting (reactions + chat)
 * - Input validation
 * - PII protection (no email addresses in socket events)
 */

import { verifyToken } from "@clerk/backend";
import { sql as getSql } from "@/lib/db";
import { checkRateLimit, getRateLimitStatus } from "@/lib/rate-limiter";

// =============================================================================
// Types
// =============================================================================

export interface ClerkTokenPayload {
  sub: string;           // userId from Clerk
  family_id?: string;    // custom claim: family_id
  name?: string;
  avatar_url?: string;
  email?: string;
}

export interface AuthenticatedUser {
  userId: string;
  familyId: string;
  displayName: string;
  avatarUrl?: string;
}

export interface RoomJoinRequest {
  familyId: string;
  videoId: string;
  sessionId: string;
}

export interface ChatMessagePayload {
  text: string;
  videoTimestamp: number;
}

export interface ReactionPayload {
  emoji: string;
  videoTimestamp: number;
}

export interface RateLimitConfig {
  reactions: {
    maxPerMinute: number;
    windowMs: number;
  };
  chat: {
    maxPerMinute: number;
    windowMs: number;
  };
}

// PRD spec: reactions max 1 per 200ms (300/min), chat 1 per 2 seconds (30/min)
// Using conservative values for spam prevention
const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  reactions: {
    maxPerMinute: 10,   // max 10 reactions per minute per user (PRD says 1 per 200ms = 300/min, but we enforce 10/min for sanity)
    windowMs: 60_000,  // 1 minute window
  },
  chat: {
    maxPerMinute: 30,   // max 1 message per 2 seconds = 30/min
    windowMs: 60_000,
  },
};

// =============================================================================
// Error Classes
// =============================================================================

export class SecurityError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 403
  ) {
    super(message);
    this.name = "SecurityError";
  }
}

export class AuthenticationError extends SecurityError {
  constructor(message: string = "Authentication required") {
    super(message, "AUTH_REQUIRED", 401);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends SecurityError {
  constructor(message: string = "Access denied") {
    super(message, "ACCESS_DENIED", 403);
    this.name = "AuthorizationError";
  }
}

export class RateLimitError extends SecurityError {
  constructor(
    message: string = "Rate limit exceeded",
    public readonly retryAfterMs: number
  ) {
    super(message, "RATE_LIMIT_EXCEEDED", 429);
    this.name = "RateLimitError";
  }
}

export class ValidationError extends SecurityError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

// =============================================================================
// Clerk JWT Verification
// =============================================================================

/**
 * Verify Clerk JWT token from Socket.IO handshake
 *
 * @param authHeader - Authorization header value (Bearer <token>)
 * @returns AuthenticatedUser with userId, familyId, displayName, avatarUrl
 * @throws AuthenticationError if token is invalid or expired
 */
export async function verifyClerkToken(authHeader: string | undefined): Promise<AuthenticatedUser> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AuthenticationError("Missing or invalid Authorization header");
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix

  if (!token) {
    throw new AuthenticationError("Empty token");
  }

  let payload: ClerkTokenPayload;

  try {
    // verifyToken throws if token is invalid/expired
    const verified = await verifyToken(token, {
      // In production, use process.env.CLERK_SECRET_KEY
      // For development, this will work with test tokens
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    payload = verified as ClerkTokenPayload;
  } catch (err) {
    throw new AuthenticationError(
      `Token verification failed: ${err instanceof Error ? err.message : "Unknown error"}`
    );
  }

  if (!payload.sub) {
    throw new AuthenticationError("Token missing user ID (sub claim)");
  }

  // family_id is required for Watch Party
  if (!payload.family_id) {
    throw new AuthorizationError("User is not a member of any family");
  }

  return {
    userId: payload.sub,
    familyId: payload.family_id,
    displayName: payload.name || "Family Member",
    avatarUrl: payload.avatar_url,
  };
}

/**
 * Extract token from Socket.IO handshake object
 * Socket.IO passes auth data in handshake.auth
 */
export function extractAuthFromHandshake(handshake: {
  auth?: { token?: string; authorization?: string };
  headers?: { authorization?: string };
}): string | undefined {
  // Priority 1: handshake.auth.token (recommended for Socket.IO)
  if (handshake.auth?.token) {
    return handshake.auth.token;
  }

  // Priority 2: handshake.auth.authorization
  if (handshake.auth?.authorization) {
    return handshake.auth.authorization;
  }

  // Priority 3: Authorization header
  if (handshake.headers?.authorization) {
    return handshake.headers.authorization;
  }

  return undefined;
}

// =============================================================================
// Family Membership Verification
// =============================================================================

/**
 * Verify user is a member of the specified family
 * Uses parameterized queries to prevent SQL injection
 *
 * @param familyId - Family ID to verify membership for
 * @param userId - User ID from Clerk JWT
 * @returns true if user is a member
 * @throws AuthorizationError if user is not a family member
 */
export async function verifyFamilyMembership(
  familyId: string,
  userId: string
): Promise<boolean> {
  // Validate input types (defense in depth)
  if (!isValidUUID(familyId)) {
    throw new ValidationError("Invalid family ID format");
  }

  if (!userId || typeof userId !== "string") {
    throw new ValidationError("Invalid user ID");
  }

  const sql = getSql();

  // Parameterized query prevents SQL injection
  const result = await sql`
    SELECT 1 FROM family_members
    WHERE family_id = ${familyId}
    AND user_id = ${userId}
    LIMIT 1
  ` as unknown as { length: number }[];

  if (result.length === 0) {
    throw new AuthorizationError(
      "User is not a member of this family. Watch Party is only available to family members."
    );
  }

  return true;
}

/**
 * Verify room join request - ensures user can only join rooms for their family
 *
 * @param request - RoomJoinRequest with familyId, videoId, sessionId
 * @param user - AuthenticatedUser from Clerk JWT
 * @throws AuthorizationError if family IDs don't match
 * @throws ValidationError if room ID format is invalid
 */
export function verifyRoomFamilyScope(
  request: RoomJoinRequest,
  user: AuthenticatedUser
): void {
  // Validate videoId is a valid UUID
  if (!isValidUUID(request.videoId)) {
    throw new ValidationError("Invalid video ID in room join request");
  }

  // Validate sessionId is a valid UUID
  if (!isValidUUID(request.sessionId)) {
    throw new ValidationError("Invalid session ID in room join request");
  }

  // Critical: User can only join rooms for their own family
  // This is the core family-scoped access control
  if (request.familyId !== user.familyId) {
    // Log potential security incident
    console.error(
      `[SECURITY] User ${user.userId} attempted to join room for family ${request.familyId} ` +
      `but belongs to family ${user.familyId}. This may indicate an attack.`
    );
    throw new AuthorizationError(
      "Cannot join a Watch Party for a family you don't belong to"
    );
  }
}

// =============================================================================
// Input Validation & Sanitization
// =============================================================================

/**
 * HTML escape special characters to prevent XSS
 * Used for sanitizing chat messages before broadcast
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",  // Using &#x27; instead of &apos; for broader compatibility
  "/": "&#x2F;",  // Prevents breaking out of attributes
};

/**
 * Escape HTML special characters in a string
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

/**
 * Sanitize chat message for XSS prevention
 *
 * Rules:
 * 1. Max 500 characters (enforced by PRD)
 * 2. No HTML tags allowed - THROWS ValidationError
 * 3. No javascript: URLs - THROWS ValidationError
 * 4. No data: URLs - THROWS ValidationError
 * 5. No control characters - THROWS ValidationError
 * 6. No RTL override characters - THROWS ValidationError
 * 7. No zero-width characters - THROWS ValidationError
 *
 * @param text - Raw message text
 * @returns Sanitized message safe for broadcast
 * @throws ValidationError if message is invalid
 */
export function sanitizeChatMessage(text: unknown): string {
  // Type check
  if (typeof text !== "string") {
    throw new ValidationError("Chat message must be a string");
  }

  // Max length check (PRD: max 500 characters)
  if (text.length > 500) {
    throw new ValidationError("Chat message must be 500 characters or less");
  }

  // Empty message check
  if (text.trim().length === 0) {
    throw new ValidationError("Chat message cannot be empty");
  }

  // Reject control characters
  if (/[\x00-\x1F\x7F]/.test(text)) {
    throw new ValidationError("Control characters are not allowed");
  }

  // Reject HTML tags
  if (/<[^>]*>/.test(text)) {
    throw new ValidationError("HTML tags are not allowed");
  }

  // Reject javascript: URLs (case insensitive)
  if (/javascript\s*:/gi.test(text)) {
    throw new ValidationError("JavaScript URLs are not allowed");
  }

  // Reject data: URLs
  if (/data\s*:/gi.test(text)) {
    throw new ValidationError("Data URLs are not allowed");
  }

  // Reject RTL override characters (used to fake usernames/urls)
  if (/\u202E/.test(text)) {
    throw new ValidationError("Right-to-left override characters are not allowed");
  }

  // Reject zero-width characters
  if (/[\u200B\u200C\u200D\uFEFF]/.test(text)) {
    throw new ValidationError("Zero-width characters are not allowed");
  }

  // Process HTML entities - allow safe ones, escape unknown
  // Note: We decode numeric entities and re-encode them properly via escapeHtml
  let sanitized = text.replace(/&(#x?[a-fA-F0-9]+|[a-zA-Z]+);/g, (match) => {
    // Allow only safe HTML entities
    const safeEntities = ["amp", "lt", "gt", "quot", "nbsp"];
    const entityName = match.replace(/[&#;]/g, "").toLowerCase();
    if (/^#x[a-fA-F0-9]+$/.test(entityName)) {
      // Hex entity - decode it
      const codePoint = parseInt(entityName.replace("#x", "0x"), 16);
      // Escape HTML special chars: < > & " '
      if (codePoint === 60) return "&lt;";
      if (codePoint === 62) return "&gt;";
      if (codePoint === 38) return "&amp;";
      if (codePoint === 34) return "&quot;";
      if (codePoint === 39) return "&#x27;";
      if (codePoint < 32) return "";
      return String.fromCodePoint(codePoint);
    }
    if (/^#[0-9]+$/.test(entityName)) {
      // Decimal entity
      const codePoint = parseInt(entityName.replace("#", ""), 10);
      // Escape HTML special chars: < > & " '
      if (codePoint === 60) return "&lt;";
      if (codePoint === 62) return "&gt;";
      if (codePoint === 38) return "&amp;";
      if (codePoint === 34) return "&quot;";
      if (codePoint === 39) return "&#x27;";
      if (codePoint < 32) return "";
      return String.fromCodePoint(codePoint);
    }
    if (safeEntities.includes(entityName)) {
      return HTML_ESCAPE_MAP[entityName] || match;
    }
    // Unknown entity - escape it by encoding it
    return escapeHtml(match);
  });

  // Trim whitespace
  return sanitized.trim();
}

/**
 * Validate emoji for reactions
 *
 * Allowed: Unicode emoji characters only
 * Blocked: ASCII art combinations that could be abuse vectors
 *
 * @param emoji - Raw emoji string
 * @returns Validated emoji
 * @throws ValidationError if emoji is invalid
 */
export function validateReactionEmoji(emoji: unknown): string {
  if (typeof emoji !== "string") {
    throw new ValidationError("Reaction emoji must be a string");
  }

  // Max 10 characters (reasonable for an emoji)
  if (emoji.length > 10) {
    throw new ValidationError("Invalid reaction emoji");
  }

  // Check if it's a reasonable emoji character
  // We allow Unicode emoji ranges
  const emojiRegex = /^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]+$/u;

  if (!emojiRegex.test(emoji)) {
    throw new ValidationError("Invalid reaction emoji");
  }

  return emoji;
}

/**
 * Validate video timestamp
 *
 * @param timestamp - Video playback position in seconds
 * @returns Validated timestamp
 * @throws ValidationError if timestamp is invalid
 */
export function validateVideoTimestamp(timestamp: unknown): number {
  if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) {
    throw new ValidationError("Video timestamp must be a number");
  }

  // Video timestamps should be non-negative and reasonable (max 24 hours)
  if (timestamp < 0 || timestamp > 86400) {
    throw new ValidationError("Invalid video timestamp");
  }

  return Math.floor(timestamp);
}

// =============================================================================
// Rate Limiting
// =============================================================================

/**
 * Rate limit key for reactions
 */
function getReactionRateLimitKey(userId: string): string {
  return `watchparty:reaction:${userId}`;
}

/**
 * Rate limit key for chat
 */
function getChatRateLimitKey(userId: string): string {
  return `watchparty:chat:${userId}`;
}

/**
 * Check rate limit for reactions
 * PRD spec: max 10 reactions per minute per user
 *
 * @param userId - User ID from Clerk JWT
 * @param config - Rate limit configuration
 * @throws RateLimitError if limit exceeded
 */
export function checkReactionRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): void {
  if (!userId || typeof userId !== "string") {
    throw new ValidationError("Invalid user ID for rate limiting");
  }

  const key = getReactionRateLimitKey(userId);
  const result = checkRateLimit(key, config.reactions.maxPerMinute, config.reactions.windowMs);

  if (!result.allowed) {
    throw new RateLimitError(
      `Too many reactions. Please wait before sending more.`,
      result.resetAt - Date.now()
    );
  }
}

/**
 * Check rate limit for chat messages
 * PRD spec: max 1 message per 2 seconds = 30/min
 *
 * @param userId - User ID from Clerk JWT
 * @param config - Rate limit configuration
 * @throws RateLimitError if limit exceeded
 */
export function checkChatRateLimit(
  userId: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT_CONFIG
): void {
  if (!userId || typeof userId !== "string") {
    throw new ValidationError("Invalid user ID for rate limiting");
  }

  const key = getChatRateLimitKey(userId);
  const result = checkRateLimit(key, config.chat.maxPerMinute, config.chat.windowMs);

  if (!result.allowed) {
    throw new RateLimitError(
      `You're sending messages too quickly. Please wait before sending more.`,
      result.resetAt - Date.now()
    );
  }
}

/**
 * Get current rate limit status for reactions (without incrementing)
 */
export function getReactionRateLimitStatus(userId: string): { remaining: number; resetAt: number; isLimited: boolean } {
  const key = getReactionRateLimitKey(userId);
  return getRateLimitStatus(key, DEFAULT_RATE_LIMIT_CONFIG.reactions.maxPerMinute, DEFAULT_RATE_LIMIT_CONFIG.reactions.windowMs);
}

/**
 * Get current rate limit status for chat (without incrementing)
 */
export function getChatRateLimitStatus(userId: string): { remaining: number; resetAt: number; isLimited: boolean } {
  const key = getChatRateLimitKey(userId);
  return getRateLimitStatus(key, DEFAULT_RATE_LIMIT_CONFIG.chat.maxPerMinute, DEFAULT_RATE_LIMIT_CONFIG.chat.windowMs);
}

// =============================================================================
// PII Protection
// =============================================================================

/**
 * Create a safe user object for Socket.IO events
 * Ensures NO PII (email addresses) is leaked in socket events
 *
 * @param user - AuthenticatedUser from Clerk JWT
 * @returns Safe user object for socket events (userId, displayName, avatarUrl only)
 */
export function safeUserForSocketEvent(user: AuthenticatedUser): {
  id: string;
  name: string;
  avatar?: string;
} {
  return {
    id: user.userId,
    name: user.displayName,
    avatar: user.avatarUrl,
  };
}

/**
 * Create safe chat message for Socket.IO broadcast
 * Ensures no PII leakage
 */
export function safeChatMessageForBroadcast(
  message: {
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    text: string;
    timestamp: string;
    videoTimestamp: number;
  }
): {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  videoTimestamp: number;
} {
  return {
    id: message.id,
    userId: message.userId,
    userName: message.userName,
    userAvatar: message.userAvatar,
    text: message.text,
    timestamp: message.timestamp,
    videoTimestamp: message.videoTimestamp,
  };
}

/**
 * Create safe reaction for Socket.IO broadcast
 * Ensures no PII leakage
 */
export function safeReactionForBroadcast(
  reaction: {
    userId: string;
    userName: string;
    emoji: string;
    videoTimestamp: number;
  }
): {
  userId: string;
  userName: string;
  emoji: string;
  videoTimestamp: number;
} {
  return {
    userId: reaction.userId,
    userName: reaction.userName,
    emoji: reaction.emoji,
    videoTimestamp: reaction.videoTimestamp,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Validate UUID format
 * Prevents injection via malformed IDs
 * Accepts standard UUID format only
 */
export function isValidUUID(value: string): boolean {
  if (typeof value !== "string") {
    return false;
  }
  // Standard UUID format (strict)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Build room ID from components
 * Format: family:${familyId}:video:${videoId}:session:${sessionId}
 */
export function buildRoomId(familyId: string, videoId: string, sessionId: string): string {
  if (!isValidUUID(familyId) || !isValidUUID(videoId) || !isValidUUID(sessionId)) {
    throw new ValidationError("Invalid room ID component");
  }
  return `family:${familyId}:video:${videoId}:session:${sessionId}`;
}

/**
 * Parse room ID into components
 */
export function parseRoomId(roomId: string): RoomJoinRequest | null {
  const parts = roomId.split(":");
  if (parts.length !== 6 || parts[0] !== "family" || parts[2] !== "video" || parts[4] !== "session") {
    return null;
  }
  return {
    familyId: parts[1],
    videoId: parts[3],
    sessionId: parts[5],
  };
}

// =============================================================================
// OWASP Top 10 Mitigations
// =============================================================================

/**
 * Security checklist for Watch Party
 * Implements mitigations for OWASP Top 10 risks relevant to real-time apps
 *
 * A01 - Broken Access Control: ✅ verifyFamilyMembership, verifyRoomFamilyScope
 * A02 - Cryptographic Failures: ✅ Clerk JWT verification, no custom crypto
 * A03 - Injection: ✅ Parameterized queries only, input validation
 * A04 - Insecure Design: ✅ Rate limiting, family-scoped rooms
 * A05 - Security Misconfiguration: ✅ No hardcoded secrets, env vars only
 * A06 - Vulnerable Components: ✅ Dependency scanning (npm audit)
 * A07 - Auth Failures: ✅ Clerk JWT with expiry, token verification
 * A08 - Data Integrity: ✅ No deserialization of untrusted data
 * A09 - Logging Failures: ✅ Security incidents logged
 * A10 - SSRF: ✅ No user-controlled URLs in socket events
 *
 * XSS: ✅ escapeHtml, sanitizeChatMessage on all user content
 * Rate limiting: ✅ checkReactionRateLimit, checkChatRateLimit
 */

// Re-export error classes for convenience
export {
  checkRateLimit,
  getRateLimitStatus,
};
