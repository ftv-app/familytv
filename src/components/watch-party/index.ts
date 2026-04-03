// Watch Party Components
export { WatchPartyContainer } from "./WatchPartyContainer";
export type { WatchPartyContainerProps } from "./WatchPartyContainer";

export { ReactionBar, REACTION_EMOJIS } from "./ReactionBar";
export type { ReactionBarProps, ReactionEmoji } from "./ReactionBar";

export { ReactionBubble, ReactionBubbleContainer } from "./ReactionBubble";
export type { ReactionBubbleData, ReactionBubbleProps } from "./ReactionBubble";

export { EmojiPicker, EXTENDED_EMOJIS } from "./EmojiPicker";
export type { EmojiPickerProps, ExtendedEmoji } from "./EmojiPicker";

export { PresenceStrip, PresenceCollapsed, PresencePopover } from "./PresenceStrip";
export type { PresenceStripProps, PresenceCollapsedProps, PresencePopoverProps } from "./PresenceStrip";

export { ChatSidebar } from "./ChatSidebar";
export type { ChatSidebarProps } from "./ChatSidebar";

export { ChatBottomSheet } from "./ChatBottomSheet";
export type { ChatBottomSheetProps } from "./ChatBottomSheet";

// Re-export Reactions from existing file (for backwards compatibility)
export { Reactions, REACTION_EMOJIS as LEGACY_REACTION_EMOJIS } from "./Reactions";
export type { Reaction, ReactionEmoji as LegacyReactionEmoji, ReactionEvent, ReactionsProps } from "./Reactions";
