import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WatchPartyContainer } from "./WatchPartyContainer";
import { ChatSidebar } from "./ChatSidebar";
import { ChatBottomSheet } from "./ChatBottomSheet";
import { PresenceStrip, PresenceCollapsed, PresencePopover } from "./PresenceStrip";
import { ReactionBar } from "./ReactionBar";
import { EmojiPicker } from "./EmojiPicker";
import { ReactionBubble } from "./ReactionBubble";
import type { ChatMessage } from "@/hooks/useWatchPartySocket";
import type { MergedPresenceUser } from "@/lib/watch-party/presence";

// Mock the socket hook
vi.mock("@/hooks/useWatchPartySocket", () => ({
  useWatchPartySocket: vi.fn(() => ({
    state: {
      isConnected: true,
      isReconnecting: false,
      presence: [],
      messages: [],
      error: null,
    },
    sendMessage: vi.fn(),
    sendReaction: vi.fn(),
    sendHeartbeat: vi.fn(),
    disconnect: vi.fn(),
    socket: null,
  })),
}));

// Mock intersection observer
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: { children: React.ReactNode }) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe("WatchPartyContainer", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render with data-testid", () => {
      render(
        <WatchPartyContainer
          roomId="test-room"
          userId="user-1"
          userName="Test User"
          videoUrl="https://example.com/video.mp4"
          videoTitle="Test Video"
          videoChosenBy="Tester"
        />
      );

      expect(screen.getByTestId("watch-party-container")).toBeInTheDocument();
    });

    it("should render video player", () => {
      render(
        <WatchPartyContainer
          roomId="test-room"
          userId="user-1"
          userName="Test User"
          videoUrl="https://example.com/video.mp4"
          videoTitle="Test Video"
          videoChosenBy="Tester"
        />
      );

      expect(screen.getByTestId("watch-party-video-player")).toBeInTheDocument();
    });

    it("should render reaction bar", () => {
      render(
        <WatchPartyContainer
          roomId="test-room"
          userId="user-1"
          userName="Test User"
          videoUrl="https://example.com/video.mp4"
          videoTitle="Test Video"
          videoChosenBy="Tester"
        />
      );

      expect(screen.getByTestId("watch-party-reaction-bar")).toBeInTheDocument();
    });
  });
});

describe("ChatSidebar", () => {
  const mockMessages: ChatMessage[] = [
    {
      id: "msg-1",
      oderId: "device-1",
      userId: "user-1",
      userName: "Mom",
      avatarUrl: null,
      text: "Hello everyone!",
      videoTimestamp: 0,
      createdAt: new Date().toISOString(),
    },
    {
      id: "msg-2",
      oderId: "device-2",
      userId: "user-2",
      userName: "Dad",
      avatarUrl: null,
      text: "Hi Mom!",
      videoTimestamp: 5,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render chat sidebar with data-testid", () => {
      render(
        <ChatSidebar
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-chat-sidebar")).toBeInTheDocument();
    });

    it("should render empty state when no messages", () => {
      render(
        <ChatSidebar
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-chat-empty")).toBeInTheDocument();
    });

    it("should render messages when provided", () => {
      render(
        <ChatSidebar
          messages={mockMessages}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-chat-messages")).toBeInTheDocument();
      expect(screen.getAllByTestId("watch-party-chat-message")).toHaveLength(2);
    });

    it("should render chat input", () => {
      render(
        <ChatSidebar
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-chat-input")).toBeInTheDocument();
    });

    it("should render send button", () => {
      render(
        <ChatSidebar
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-chat-send")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onSendMessage when form is submitted", async () => {
      const user = userEvent.setup();
      const sendMessage = vi.fn();

      render(
        <ChatSidebar
          messages={[]}
          currentUserId="user-1"
          onSendMessage={sendMessage}
        />
      );

      const input = screen.getByTestId("watch-party-chat-input");
      await user.click(input);
      await user.keyboard("Hello world!");

      const sendButton = screen.getByTestId("watch-party-chat-send");
      await user.click(sendButton);

      expect(sendMessage).toHaveBeenCalledWith("Hello world!");
    });

    it("should clear input after send", async () => {
      const user = userEvent.setup();
      const sendMessage = vi.fn();

      render(
        <ChatSidebar
          messages={[]}
          currentUserId="user-1"
          onSendMessage={sendMessage}
        />
      );

      const input = screen.getByTestId("watch-party-chat-input");
      await user.click(input);
      await user.keyboard("Test message");

      const sendButton = screen.getByTestId("watch-party-chat-send");
      await user.click(sendButton);

      expect(input).toHaveValue("");
    });

    it("should not send empty messages", async () => {
      const user = userEvent.setup();
      const sendMessage = vi.fn();

      render(
        <ChatSidebar
          messages={[]}
          currentUserId="user-1"
          onSendMessage={sendMessage}
        />
      );

      const sendButton = screen.getByTestId("watch-party-chat-send");
      await user.click(sendButton);

      expect(sendMessage).not.toHaveBeenCalled();
    });
  });
});

describe("ChatBottomSheet", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(
        <ChatBottomSheet
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByTestId("watch-party-chat-bottom-sheet")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <ChatBottomSheet
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-chat-bottom-sheet")).toBeInTheDocument();
    });

    it("should render close button with data-testid", () => {
      render(
        <ChatBottomSheet
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-chat-close")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <ChatBottomSheet
          messages={[]}
          currentUserId="user-1"
          onSendMessage={vi.fn()}
          isOpen={true}
          onClose={onClose}
        />
      );

      const closeButton = screen.getByTestId("watch-party-chat-close");
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe("PresenceStrip", () => {
  const mockUsers: MergedPresenceUser[] = [
    {
      oderId: "user-1",
      userId: "user-1",
      name: "Mom",
      avatar: null,
      status: "active",
      isMultiDevice: false,
      deviceCount: 1,
      lastSeen: Date.now(),
    },
    {
      oderId: "user-2",
      userId: "user-2",
      name: "Dad",
      avatar: null,
      status: "idle",
      isMultiDevice: false,
      deviceCount: 1,
      lastSeen: Date.now() - 45000,
    },
  ];

  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render presence strip with data-testid", () => {
      render(<PresenceStrip users={mockUsers} currentUserId="user-3" />);

      expect(screen.getByTestId("watch-party-presence-strip")).toBeInTheDocument();
    });

    it("should render active and idle dots with correct data-testid", () => {
      render(<PresenceStrip users={mockUsers} currentUserId="user-3" />);

      expect(screen.getAllByTestId("watch-party-presence-dot-active")).toHaveLength(1);
      expect(screen.getAllByTestId("watch-party-presence-dot-idle")).toHaveLength(1);
    });

    it("should show 'Just you' when no users", () => {
      render(<PresenceStrip users={[]} currentUserId="user-1" />);

      expect(screen.getByTestId("watch-party-presence-only-you")).toBeInTheDocument();
    });
  });
});

describe("PresenceCollapsed", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render collapsed presence with data-testid", () => {
      render(<PresenceCollapsed users={[]} currentUserId="user-1" onTap={vi.fn()} />);

      expect(screen.getByTestId("watch-party-presence-collapsed")).toBeInTheDocument();
    });

    it("should render watch count", () => {
      render(<PresenceCollapsed users={[]} currentUserId="user-1" onTap={vi.fn()} />);

      expect(screen.getByText(/watching/)).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onTap when clicked", async () => {
      const user = userEvent.setup();
      const onTap = vi.fn();

      render(<PresenceCollapsed users={[]} currentUserId="user-1" onTap={onTap} />);

      const button = screen.getByTestId("watch-party-presence-collapsed");
      await user.click(button);

      expect(onTap).toHaveBeenCalled();
    });
  });
});

describe("PresencePopover", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(
        <PresencePopover
          users={[]}
          currentUserId="user-1"
          isOpen={false}
          onClose={vi.fn()}
        />
      );

      expect(screen.queryByTestId("watch-party-presence-popover")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <PresencePopover
          users={[]}
          currentUserId="user-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-presence-popover")).toBeInTheDocument();
    });

    it("should render close button", () => {
      render(
        <PresencePopover
          users={[]}
          currentUserId="user-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      );

      expect(screen.getByTestId("watch-party-presence-popover-close")).toBeInTheDocument();
    });
  });
});

describe("ReactionBar", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render reaction bar with data-testid", () => {
      render(<ReactionBar onReaction={vi.fn()} />);

      expect(screen.getByTestId("watch-party-reaction-bar")).toBeInTheDocument();
    });

    it("should render all default reaction buttons", () => {
      render(<ReactionBar onReaction={vi.fn()} />);

      // Buttons are rendered twice (desktop + mobile), so use getAllByTestId
      // We should have 12 buttons total (6 desktop + 6 mobile)
      const buttons = screen.getAllByTestId(/watch-party-reaction-/);
      expect(buttons.length).toBeGreaterThanOrEqual(6);
    });

    it("should render emoji picker toggle on desktop", () => {
      render(<ReactionBar onReaction={vi.fn()} />);

      expect(screen.getByTestId("watch-party-emoji-picker-toggle")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should render buttons that can be interacted with", async () => {
      const onReaction = vi.fn();

      render(<ReactionBar onReaction={onReaction} />);

      // Use getAllByTestId since buttons are rendered twice (desktop + mobile)
      // Filter to only include the reaction buttons (not the expand button)
      const reactionButtons = screen.getAllByTestId(/^watch-party-reaction-(laugh|heart|wow|clap|cry|party)$/);

      // Verify buttons exist and are not disabled
      expect(reactionButtons.length).toBeGreaterThan(0);
      reactionButtons.forEach((btn) => {
        expect(btn).not.toBeDisabled();
      });
    });
  });
});

describe("EmojiPicker", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should not render when isOpen is false", () => {
      render(
        <EmojiPicker isOpen={false} onClose={vi.fn()} onSelect={vi.fn()} />
      );

      expect(screen.queryByTestId("watch-party-emoji-picker")).not.toBeInTheDocument();
    });

    it("should render when isOpen is true", () => {
      render(
        <EmojiPicker isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />
      );

      expect(screen.getByTestId("watch-party-emoji-picker")).toBeInTheDocument();
    });

    it("should render emoji items", () => {
      render(
        <EmojiPicker isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />
      );

      // Check that emoji picker items exist (by partial match)
      const items = screen.getAllByTestId(/watch-party-emoji-picker-item-/);
      expect(items.length).toBeGreaterThan(0);
    });

    it("should render close button", () => {
      render(
        <EmojiPicker isOpen={true} onClose={vi.fn()} onSelect={vi.fn()} />
      );

      expect(screen.getByTestId("watch-party-emoji-picker-close")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("should call onSelect when emoji is clicked", async () => {
      const user = userEvent.setup();
      const onSelect = vi.fn();

      render(
        <EmojiPicker isOpen={true} onClose={vi.fn()} onSelect={onSelect} />
      );

      // Click first emoji item
      const emoji = screen.getAllByTestId(/watch-party-emoji-picker-item-/)[0];
      await user.click(emoji);

      expect(onSelect).toHaveBeenCalled();
    });

    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <EmojiPicker isOpen={true} onClose={onClose} onSelect={vi.fn()} />
      );

      const closeButton = screen.getByTestId("watch-party-emoji-picker-close");
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });
  });
});

describe("ReactionBubble", () => {
  beforeEach(() => {
    cleanup();
  });

  describe("Rendering", () => {
    it("should render bubble with data-testid", () => {
      render(
        <ReactionBubble
          reaction={{
            id: "bubble-1",
            emoji: "laugh",
            userName: "Mom",
            isOwn: false,
          }}
        />
      );

      expect(screen.getByTestId("watch-party-reaction-bubble")).toBeInTheDocument();
    });

    it("should render user name", () => {
      render(
        <ReactionBubble
          reaction={{
            id: "bubble-1",
            emoji: "heart",
            userName: "Dad",
            isOwn: false,
          }}
        />
      );

      expect(screen.getByText("Dad")).toBeInTheDocument();
    });

    it("should render 'You' for own reactions", () => {
      render(
        <ReactionBubble
          reaction={{
            id: "bubble-1",
            emoji: "party",
            userName: "You",
            isOwn: true,
          }}
        />
      );

      expect(screen.getByText("You")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-label describing the reaction", () => {
      render(
        <ReactionBubble
          reaction={{
            id: "bubble-1",
            emoji: "laugh",
            userName: "Mom",
            isOwn: false,
          }}
        />
      );

      const bubble = screen.getByTestId("watch-party-reaction-bubble");
      expect(bubble).toHaveAttribute("aria-label", expect.stringContaining("reacted with"));
    });
  });
});
