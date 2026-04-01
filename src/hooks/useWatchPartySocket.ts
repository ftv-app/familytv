"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { PresenceState, MergedPresenceUser } from "@/lib/watch-party/presence";

/* ============================================================
   Types
   ============================================================ */

export interface ChatMessage {
  id: string;
  oderId: string;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  text: string;
  videoTimestamp: number;
  createdAt: string; // ISO timestamp
}

export interface ReactionEvent {
  userId: string;
  userName: string;
  emoji: string;
  videoTimestamp: number;
}

export interface WatchPartySocketState {
  isConnected: boolean;
  isReconnecting: boolean;
  presence: MergedPresenceUser[];
  messages: ChatMessage[];
  error: string | null;
}

/* ============================================================
   Hook Return Type
   ============================================================ */

export interface UseWatchPartySocketOptions {
  roomId: string;
  userId: string;
  userName: string;
  avatarUrl?: string;
  socketUrl?: string;
  /** Enable chat functionality (default: true) */
  enableChat?: boolean;
  /** Enable presence functionality (default: true) */
  enablePresence?: boolean;
  /** Heartbeat interval in ms (default: 10000) */
  heartbeatInterval?: number;
  /** Called when presence updates */
  onPresenceUpdate?: (presence: MergedPresenceUser[]) => void;
  /** Called when a new chat message is received */
  onMessageReceived?: (message: ChatMessage) => void;
  /** Called when a reaction is received */
  onReactionReceived?: (reaction: ReactionEvent) => void;
  /** Called when connection state changes */
  onConnectionChange?: (isConnected: boolean) => void;
}

export interface UseWatchPartySocketReturn {
  /** Current socket state */
  state: WatchPartySocketState;
  /** Send a chat message */
  sendMessage: (text: string, videoTimestamp?: number) => void;
  /** Send a reaction */
  sendReaction: (emoji: string, videoTimestamp?: number) => void;
  /** Manually send a heartbeat */
  sendHeartbeat: () => void;
  /** Disconnect the socket */
  disconnect: () => void;
  /** Socket instance (for advanced use) */
  socket: Socket | null;
}

/* ============================================================
   Constants
   ============================================================ */

const HEARTBEAT_INTERVAL_MS = 10_000;
const MAX_MESSAGES = 100;
const MAX_REACTIONS = 15;
const MESSAGE_RATE_LIMIT_MS = 2_000;
const REACTION_RATE_LIMIT_MS = 200;

/* ============================================================
   Hook Implementation
   ============================================================ */

export function useWatchPartySocket({
  roomId,
  userId,
  userName,
  avatarUrl,
  socketUrl,
  enableChat = true,
  enablePresence = true,
  heartbeatInterval = HEARTBEAT_INTERVAL_MS,
  onPresenceUpdate,
  onMessageReceived,
  onReactionReceived,
  onConnectionChange,
}: UseWatchPartySocketOptions): UseWatchPartySocketReturn {
  const [state, setState] = useState<WatchPartySocketState>({
    isConnected: false,
    isReconnecting: false,
    presence: [],
    messages: [],
    error: null,
  });

  const socketRef = useRef<Socket | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastMessageTimeRef = useRef<number>(0);
  const lastReactionTimeRef = useRef<number>(0);
  const reactionsRef = useRef<Set<string>>(new Set());

  /* ---- Send heartbeat ---- */
  const sendHeartbeat = useCallback(() => {
    if (!socketRef.current?.connected || !enablePresence) return;
    socketRef.current.emit("presence:heartbeat", {
      roomId,
      userId,
      userName,
      avatar: avatarUrl,
    });
  }, [roomId, userId, userName, avatarUrl, enablePresence]);

  /* ---- Send chat message ---- */
  const sendMessage = useCallback(
    (text: string, videoTimestamp = 0) => {
      if (!socketRef.current?.connected || !enableChat) return;

      // Client-side rate limit (2s)
      const now = Date.now();
      if (now - lastMessageTimeRef.current < MESSAGE_RATE_LIMIT_MS) {
        return;
      }
      lastMessageTimeRef.current = now;

      // Trim and validate
      const trimmed = text.trim().slice(0, 500);
      if (!trimmed) return;

      socketRef.current.emit("chat:send", {
        roomId,
        userId,
        userName,
        avatar: avatarUrl,
        text: trimmed,
        videoTimestamp,
      });
    },
    [roomId, userId, userName, avatarUrl, enableChat]
  );

  /* ---- Send reaction ---- */
  const sendReaction = useCallback(
    (emoji: string, videoTimestamp = 0) => {
      if (!socketRef.current?.connected) return;

      // Client-side rate limit (200ms) + deduplication
      const now = Date.now();
      const dedupKey = `${emoji}-${videoTimestamp}`;
      if (
        now - lastReactionTimeRef.current < REACTION_RATE_LIMIT_MS ||
        reactionsRef.current.has(dedupKey)
      ) {
        return;
      }
      lastReactionTimeRef.current = now;
      reactionsRef.current.add(dedupKey);
      // Clear dedup after 500ms
      setTimeout(() => reactionsRef.current.delete(dedupKey), 500);

      socketRef.current.emit("reaction:send", {
        roomId,
        userId,
        userName,
        emoji,
        videoTimestamp,
      });
    },
    [roomId, userId, userName]
  );

  /* ---- Disconnect ---- */
  const disconnect = useCallback(() => {
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.emit("room:leave", { roomId, userId });
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isConnected: false,
      isReconnecting: false,
    }));
    onConnectionChange?.(false);
  }, [roomId, userId, onConnectionChange]);

  /* ---- Initialize Socket ---- */
  useEffect(() => {
    if (!roomId || !userId) return;

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setState((prev) => ({
        ...prev,
        isConnected: true,
        isReconnecting: false,
        error: null,
      }));
      onConnectionChange?.(true);

      // Join the room
      socket.emit("room:join", {
        roomId,
        userId,
        userName,
        avatar: avatarUrl,
      });
    });

    socket.on("disconnect", (reason) => {
      const isExplicitDisconnect = reason === "io client disconnect";
      setState((prev) => ({
        ...prev,
        isConnected: false,
        isReconnecting: !isExplicitDisconnect,
      }));
      onConnectionChange?.(false);

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    });

    socket.on("connect_error", (error) => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: error.message,
      }));
    });

    // Room joined confirmation
    socket.on(
      "room:joined",
      (data: { roomId: string; presence: PresenceState; messages?: ChatMessage[] }) => {
        if (data.roomId !== roomId) return;
        setState((prev) => ({
          ...prev,
          presence: data.presence.users,
          messages: data.messages?.slice(-MAX_MESSAGES) ?? prev.messages,
        }));
        onPresenceUpdate?.(data.presence.users);
      }
    );

    // Presence updates
    socket.on(
      "presence:update",
      (data: { users: MergedPresenceUser[] }) => {
        setState((prev) => ({
          ...prev,
          presence: data.users,
        }));
        onPresenceUpdate?.(data.users);
      }
    );

    // Chat messages
    if (enableChat) {
      socket.on(
        "chat:new",
        (message: ChatMessage) => {
          setState((prev) => {
            // Deduplicate by id
            if (prev.messages.some((m) => m.id === message.id)) return prev;
            const updated = [...prev.messages, message];
            return {
              ...prev,
              messages: updated.slice(-MAX_MESSAGES),
            };
          });
          onMessageReceived?.(message);
        }
      );

      // Chat history on join
      socket.on(
        "chat:history",
        (messages: ChatMessage[]) => {
          setState((prev) => ({
            ...prev,
            messages: messages.slice(-MAX_MESSAGES),
          }));
        }
      );
    }

    // Reactions
    socket.on(
      "reaction:new",
      (reaction: ReactionEvent & { oderId?: string }) => {
        onReactionReceived?.(reaction);
      }
    );

    // Error handling
    socket.on("error", (error: { code: string; message: string }) => {
      setState((prev) => ({
        ...prev,
        error: error.message,
      }));
    });

    return () => {
      disconnect();
    };
  }, [
    roomId,
    userId,
    userName,
    avatarUrl,
    socketUrl,
    enableChat,
    enablePresence,
    onPresenceUpdate,
    onMessageReceived,
    onReactionReceived,
    onConnectionChange,
    disconnect,
  ]);

  /* ---- Heartbeat timer ---- */
  useEffect(() => {
    if (!enablePresence || !state.isConnected) return;

    // Immediate heartbeat on connect
    sendHeartbeat();

    heartbeatTimerRef.current = setInterval(() => {
      sendHeartbeat();
    }, heartbeatInterval);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [enablePresence, state.isConnected, heartbeatInterval, sendHeartbeat]);

  return {
    state,
    sendMessage,
    sendReaction,
    sendHeartbeat,
    disconnect,
    socket: socketRef.current,
  };
}
