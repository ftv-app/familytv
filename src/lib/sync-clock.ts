/**
 * Server-authoritative sync clock module - CTM-223
 * Provides wall-clock UTC time for FamilyTV synchronized playback
 * and ensures all family members see content in the same chronological order
 */

let _initialized = false;
let _initTime = 0;
let _lastDriftWarning = 0;
const DRIFT_WARNING_INTERVAL_MS = 60_000; // 1 minute between warnings

// Drift threshold for client clock correction (in ms)
// If client clock is off by more than this, flag for correction
const DRIFT_CORRECTION_THRESHOLD_MS = 5000; // 5 seconds

export interface SyncClockResponse {
  serverTime: number;
  iso: string;
  offset: number;
  uptime: number;
  health: string;
}

export interface FamilySyncState {
  familyId: string;
  lastServerTime: Date;
  lastSyncedAt: Date;
  driftMs: number;
  needsFullSync: boolean;
}

export interface SyncDelta {
  posts: unknown[];
  events: unknown[];
  serverTimestamp: Date;
  hasMore: boolean;
}

export interface InitOptions {
  // Reserved for future configuration
  driftWarningIntervalMs?: number;
}

/**
 * Get current UTC time in milliseconds (Unix epoch)
 */
export function now(): number {
  return Date.now();
}

/**
 * Get current UTC time as ISO 8601 string
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Get current server timestamp as Date object
 */
export function serverNow(): Date {
  return new Date();
}

/**
 * Get full sync clock response for API
 */
export function getSyncClockResponse(): SyncClockResponse {
  return {
    serverTime: now(),
    iso: nowISO(),
    offset: 0, // Reserved for future offset tracking
    uptime: uptime(),
    health: getClockHealth(),
  };
}

/**
 * Get family-specific sync state response for API
 */
export function getFamilySyncStateResponse(familyId: string, lastSyncedAt?: Date): FamilySyncState {
  const serverTime = serverNow();
  
  let driftMs = 0;
  let needsFullSync = false;
  
  if (lastSyncedAt) {
    // Calculate time since last sync
    const timeSinceSync = serverTime.getTime() - lastSyncedAt.getTime();
    // If last sync was more than 1 hour ago, suggest full sync
    needsFullSync = timeSinceSync > 60 * 60 * 1000;
  } else {
    // No last sync time provided - this is a first sync
    needsFullSync = true;
  }
  
  return {
    familyId,
    lastServerTime: serverTime,
    lastSyncedAt: lastSyncedAt ?? serverTime,
    driftMs,
    needsFullSync,
  };
}

/**
 * Calculate drift between client timestamp and server time
 * Returns the difference in milliseconds (positive = client is ahead)
 */
export function calculateClientDrift(clientTimestamp: number | string | Date): number {
  const clientTime = new Date(clientTimestamp).getTime();
  const serverTime = Date.now();
  return clientTime - serverTime;
}

/**
 * Check if client drift exceeds the correction threshold
 */
export function needsDriftCorrection(clientTimestamp: number | string | Date): boolean {
  const drift = Math.abs(calculateClientDrift(clientTimestamp));
  return drift > DRIFT_CORRECTION_THRESHOLD_MS;
}

/**
 * Get current clock health status
 */
export function getClockHealth(): 'OK' | 'INITIALIZING' | 'DRIFT_WARNING' {
  if (!_initialized) {
    return 'INITIALIZING';
  }
  // Could add drift detection here in the future
  return 'OK';
}

/**
 * Check clock drift and log warning if significant
 * Rate-limited to prevent log spam
 */
export function checkDrift(ms: number): void {
  const now = Date.now();
  if (now - _lastDriftWarning >= DRIFT_WARNING_INTERVAL_MS) {
    _lastDriftWarning = now;
    // Warning is rate-limited; actual logging would happen here
  }
}

/**
 * Initialize the sync clock module
 */
export function initSyncClock(opts?: InitOptions): void {
  _initTime = Date.now();
  _initialized = true;
}

/**
 * Get uptime of the clock module in milliseconds
 */
export function uptime(): number {
  if (!_initialized) {
    return 0;
  }
  return Date.now() - _initTime;
}

/**
 * Validate that a client timestamp is within acceptable bounds
 * @returns Object with valid flag and optional error message
 */
export function validateClientTimestamp(
  clientTimestamp: number | string | Date | undefined,
  options?: { maxFutureMs?: number; maxPastMs?: number }
): { valid: boolean; error?: string; driftMs?: number } {
  const maxFutureMs = options?.maxFutureMs ?? 5000; // 5 seconds in the future
  const maxPastMs = options?.maxPastMs ?? 60000;    // 60 seconds in the past
  
  if (clientTimestamp === undefined) {
    return { valid: true }; // No timestamp provided - that's ok
  }
  
  const clientTime = new Date(clientTimestamp).getTime();
  const now = Date.now();
  const drift = clientTime - now;
  
  if (clientTime > now + maxFutureMs) {
    return {
      valid: false,
      error: "Client timestamp is too far in the future",
      driftMs: drift,
    };
  }
  
  if (now - clientTime > maxPastMs) {
    return {
      valid: false,
      error: "Client timestamp is too old",
      driftMs: drift,
    };
  }
  
  return { valid: true, driftMs: drift };
}

/**
 * Generate a server-authoritative timestamp for database inserts
 * This should be used instead of trusting client-provided timestamps
 */
export function generateServerTimestamp(): Date {
  return new Date();
}

/**
 * Sort items by serverTimestamp for consistent ordering
 * Use this to ensure all clients see items in the same order
 */
export function sortByServerTimestamp<T extends { serverTimestamp: Date }>(
  items: T[]
): T[] {
  return [...items].sort((a, b) => 
    a.serverTimestamp.getTime() - b.serverTimestamp.getTime()
  );
}
