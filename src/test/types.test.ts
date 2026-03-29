import { describe, it, expect } from "vitest";
import type {
  User,
  Family,
  FamilyMember,
  Invite,
  Event,
  Post,
  PostWithAuthor,
  Notification,
  NotificationType,
  EventType,
  MediaType,
  FamilyWithMemberCount,
  FamilyMemberWithUser,
  NotificationWithDetails,
  ActivityLog,
} from "@/lib/types";

describe("types", () => {
  describe("User", () => {
    it("has correct shape", () => {
      const user: User = {
        id: "123",
        clerk_id: "clerk_123",
        email: "user@example.com",
        name: "John Doe",
        created_at: new Date(),
      };
      expect(user.id).toBe("123");
      expect(user.clerk_id).toBe("clerk_123");
      expect(user.email).toBe("user@example.com");
      expect(user.name).toBe("John Doe");
      expect(user.created_at).toBeInstanceOf(Date);
    });

    it("allows null name", () => {
      const user: User = {
        id: "123",
        clerk_id: "clerk_123",
        email: "user@example.com",
        name: null,
        created_at: new Date(),
      };
      expect(user.name).toBeNull();
    });
  });

  describe("Family", () => {
    it("has correct shape", () => {
      const family: Family = {
        id: "123",
        name: "The Smiths",
        created_at: new Date(),
      };
      expect(family.id).toBe("123");
      expect(family.name).toBe("The Smiths");
      expect(family.created_at).toBeInstanceOf(Date);
    });
  });

  describe("FamilyMember", () => {
    it("has correct shape with member role", () => {
      const member: FamilyMember = {
        id: "123",
        family_id: "fam_123",
        user_id: "user_123",
        role: "member",
        joined_at: new Date(),
      };
      expect(member.role).toBe("member");
    });

    it("has correct shape with owner role", () => {
      const member: FamilyMember = {
        id: "123",
        family_id: "fam_123",
        user_id: "user_123",
        role: "owner",
        joined_at: new Date(),
      };
      expect(member.role).toBe("owner");
    });

    it("has correct shape with admin role", () => {
      const member: FamilyMember = {
        id: "123",
        family_id: "fam_123",
        user_id: "user_123",
        role: "admin",
        joined_at: new Date(),
      };
      expect(member.role).toBe("admin");
    });
  });

  describe("Invite", () => {
    it("has correct shape with pending status", () => {
      const invite: Invite = {
        id: "123",
        family_id: "fam_123",
        email: "invitee@example.com",
        token: "abc123",
        status: "pending",
        expires_at: new Date(),
        created_at: new Date(),
      };
      expect(invite.status).toBe("pending");
    });

    it("accepts all valid statuses", () => {
      const statuses: Invite["status"][] = ["pending", "accepted", "declined", "expired"];
      statuses.forEach((status) => {
        const invite: Invite = {
          id: "123",
          family_id: "fam_123",
          email: "invitee@example.com",
          token: "abc123",
          status,
          expires_at: new Date(),
          created_at: new Date(),
        };
        expect(invite.status).toBe(status);
      });
    });
  });

  describe("EventType", () => {
    it("has all valid event types", () => {
      const types: EventType[] = ["birthday", "gathering", "reminder", "other"];
      types.forEach((t) => expect(t).toBeDefined());
    });
  });

  describe("MediaType", () => {
    it("has correct media types", () => {
      const types: MediaType[] = ["image", "video"];
      expect(types).toContain("image");
      expect(types).toContain("video");
    });
  });

  describe("Post", () => {
    it("has correct shape for text post", () => {
      const post: Post = {
        id: "123",
        family_id: "fam_123",
        author_id: "user_123",
        content: "Hello family!",
        media_url: null,
        media_type: null,
        created_at: new Date(),
      };
      expect(post.content).toBe("Hello family!");
      expect(post.media_url).toBeNull();
      expect(post.media_type).toBeNull();
    });

    it("has correct shape for image post", () => {
      const post: Post = {
        id: "123",
        family_id: "fam_123",
        author_id: "user_123",
        content: null,
        media_url: "https://blob.vercel.com/image.jpg",
        media_type: "image",
        created_at: new Date(),
      };
      expect(post.media_url).toBe("https://blob.vercel.com/image.jpg");
      expect(post.media_type).toBe("image");
    });
  });

  describe("PostWithAuthor", () => {
    it("extends Post with author info", () => {
      const post: PostWithAuthor = {
        id: "123",
        family_id: "fam_123",
        author_id: "user_123",
        content: "Hello!",
        media_url: null,
        media_type: null,
        created_at: new Date(),
        author_name: "John",
        author_email: "john@example.com",
      };
      expect(post.author_name).toBe("John");
      expect(post.author_email).toBe("john@example.com");
    });
  });

  describe("NotificationType", () => {
    it("has all valid notification types", () => {
      const types: NotificationType[] = ["post_created", "event_reminder", "invite_received"];
      expect(types).toContain("post_created");
      expect(types).toContain("event_reminder");
      expect(types).toContain("invite_received");
    });
  });

  describe("Notification", () => {
    it("has correct shape", () => {
      const notification: Notification = {
        id: "123",
        user_id: "user_123",
        family_id: "fam_123",
        type: "post_created",
        related_id: "post_123",
        message: "New post in your family",
        read: false,
        created_at: new Date(),
      };
      expect(notification.type).toBe("post_created");
      expect(notification.read).toBe(false);
    });
  });

  describe("FamilyWithMemberCount", () => {
    it("extends Family with member_count", () => {
      const family: FamilyWithMemberCount = {
        id: "123",
        name: "The Smiths",
        created_at: new Date(),
        member_count: 5,
      };
      expect(family.member_count).toBe(5);
    });
  });

  describe("ActivityLog", () => {
    it("has correct shape", () => {
      const log: ActivityLog = {
        id: "123",
        family_id: "fam_123",
        actor_id: "user_123",
        action: "post_created",
        metadata: { postId: "post_123" },
        created_at: new Date(),
      };
      expect(log.action).toBe("post_created");
      expect(log.metadata.postId).toBe("post_123");
    });

    it("allows null actor_id", () => {
      const log: ActivityLog = {
        id: "123",
        family_id: "fam_123",
        actor_id: null,
        action: "family_created",
        metadata: {},
        created_at: new Date(),
      };
      expect(log.actor_id).toBeNull();
    });
  });
});
