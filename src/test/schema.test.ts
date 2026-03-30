import { describe, it, expect } from "vitest";
import {
  families,
  familyMemberships,
  invites,
  posts,
  comments,
  reactions,
  calendarEvents,
  membershipRoleEnum,
  inviteStatusEnum,
  familiesRelations,
  familyMembershipsRelations,
  invitesRelations,
  postsRelations,
  calendarEventsRelations,
} from "@/db/schema";

describe("schema", () => {
  describe("table exports", () => {
    it("families table is exported", () => {
      expect(families).toBeDefined();
      expect(typeof families).toBe("object");
    });

    it("familyMemberships table is exported", () => {
      expect(familyMemberships).toBeDefined();
      expect(typeof familyMemberships).toBe("object");
    });

    it("invites table is exported", () => {
      expect(invites).toBeDefined();
      expect(typeof invites).toBe("object");
    });

    it("posts table is exported", () => {
      expect(posts).toBeDefined();
      expect(typeof posts).toBe("object");
    });

    it("comments table is exported", () => {
      expect(comments).toBeDefined();
      expect(typeof comments).toBe("object");
    });

    it("reactions table is exported", () => {
      expect(reactions).toBeDefined();
      expect(typeof reactions).toBe("object");
    });

    it("calendarEvents table is exported", () => {
      expect(calendarEvents).toBeDefined();
      expect(typeof calendarEvents).toBe("object");
    });
  });

  describe("enums", () => {
    it("membershipRoleEnum has correct values", () => {
      const values = membershipRoleEnum.enumValues;
      expect(values).toContain("owner");
      expect(values).toContain("member");
    });

    it("inviteStatusEnum has correct values", () => {
      const values = inviteStatusEnum.enumValues;
      expect(values).toContain("pending");
      expect(values).toContain("accepted");
      expect(values).toContain("revoked");
    });
  });

  describe("relations", () => {
    it("familiesRelations is defined", () => {
      expect(familiesRelations).toBeDefined();
    });

    it("familyMembershipsRelations is defined", () => {
      expect(familyMembershipsRelations).toBeDefined();
    });

    it("invitesRelations is defined", () => {
      expect(invitesRelations).toBeDefined();
    });

    it("postsRelations is defined", () => {
      expect(postsRelations).toBeDefined();
    });

    it("calendarEventsRelations is defined", () => {
      expect(calendarEventsRelations).toBeDefined();
    });
  });

  describe("families table structure", () => {
    it("has required fields accessible", () => {
      // Test that the table has expected properties
      expect(families).toHaveProperty("id");
      expect(families).toHaveProperty("name");
      expect(families).toHaveProperty("createdAt");
    });
  });

  describe("familyMemberships table structure", () => {
    it("has required fields accessible", () => {
      expect(familyMemberships).toHaveProperty("id");
      expect(familyMemberships).toHaveProperty("familyId");
      expect(familyMemberships).toHaveProperty("userId");
      expect(familyMemberships).toHaveProperty("role");
    });
  });

  describe("invites table structure", () => {
    it("has required fields accessible", () => {
      expect(invites).toHaveProperty("id");
      expect(invites).toHaveProperty("familyId");
      expect(invites).toHaveProperty("email");
      expect(invites).toHaveProperty("status");
    });
  });

  describe("posts table structure", () => {
    it("has required fields accessible", () => {
      expect(posts).toHaveProperty("id");
      expect(posts).toHaveProperty("familyId");
      expect(posts).toHaveProperty("authorId");
      expect(posts).toHaveProperty("contentType");
    });
  });

  describe("comments table structure", () => {
    it("has required fields accessible", () => {
      expect(comments).toHaveProperty("id");
      expect(comments).toHaveProperty("postId");
      expect(comments).toHaveProperty("authorId");
      expect(comments).toHaveProperty("content");
    });
  });

  describe("reactions table structure", () => {
    it("has required fields accessible", () => {
      expect(reactions).toHaveProperty("id");
      expect(reactions).toHaveProperty("postId");
      expect(reactions).toHaveProperty("userId");
      expect(reactions).toHaveProperty("emoji");
    });
  });

  describe("calendarEvents table structure", () => {
    it("has required fields accessible", () => {
      expect(calendarEvents).toHaveProperty("id");
      expect(calendarEvents).toHaveProperty("familyId");
      expect(calendarEvents).toHaveProperty("title");
      expect(calendarEvents).toHaveProperty("startDate");
    });
  });
});
