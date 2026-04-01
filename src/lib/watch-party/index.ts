/**
 * Watch Party Module
 * 
 * Real-time presence, reactions, and chat for FamilyTV Watch Party.
 */

// Re-export only unique types and functions
export type {
  // From presence
  PresenceStatus,
  PresenceUser,
  MergedPresenceUser,
  RoomJoinedPayload,
} from './presence';

export {
  // From presence
  PresenceManager,
  getPresenceManager,
  resetPresenceManager,
  buildRoomId,
  parseRoomId,
  isValidRoomId,
  isValidPresenceUpdate,
} from './presence';

export {
  // From socket-handlers
  registerPresenceHandlers,
  getRoomPresenceState,
  hasRoom,
} from './socket-handlers';

export type {
  // From chat-handler
  ChatMessagePayload,
  ChatMessage,
} from './chat-handler';

export {
  // From chat-handler
  registerChatHandlers,
  getRoomChatHistory,
} from './chat-handler';

export type {
  // From reaction-handler
  ReactionPayload,
  Reaction,
} from './reaction-handler';

export {
  // From reaction-handler
  registerReactionHandlers,
} from './reaction-handler';

export type {
  // From server
  ServerOptions,
} from './server';

export {
  // From server
  createWatchPartyServer,
  attachSocketServer,
  getSocketServer,
  resetSocketServer,
} from './server';

export type {
  // From security
  AuthenticatedUser,
  SecurityError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,
  ValidationError,
} from './security';

export {
  // From security
  verifyClerkToken,
  extractAuthFromHandshake,
  verifyRoomFamilyScope,
  sanitizeChatMessage,
  validateReactionEmoji,
  validateVideoTimestamp,
  checkChatRateLimit,
  checkReactionRateLimit,
  getChatRateLimitStatus,
  getReactionRateLimitStatus,
  safeUserForSocketEvent,
  safeChatMessageForBroadcast,
  safeReactionForBroadcast,
  isValidUUID,
} from './security';
