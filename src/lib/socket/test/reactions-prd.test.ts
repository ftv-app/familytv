/**
 * CTM-232 Quick Reactions — PRD-compliant emoji set test
 *
 * Validates that VALID_EMOJIS matches the PRD spec:
 * ["🎬", "😂", "❤️", "🔥", "😮", "💯"]
 *
 * This test documents the correct emoji set per the PRD for Watch Party reactions.
 */

import { describe, it, expect } from "vitest";
import { VALID_EMOJIS } from "../types";

// PRD spec: Watch Party reactions use 6 emoji set
const PRD_EMOJIS = ["🎬", "😂", "❤️", "🔥", "😮", "💯"] as const;

describe("CTM-232 Quick Reactions — PRD Emoji Set", () => {
  describe("VALID_EMOJIS matches PRD spec", () => {
    it("should contain exactly the 6 PRD-specified emojis", () => {
      expect(VALID_EMOJIS).toEqual(PRD_EMOJIS);
    });

    it("should have length of 6", () => {
      expect(VALID_EMOJIS.length).toBe(6);
    });

    it("should include clapper board 🎬 (PRD: 'Share a笑 moment')", () => {
      expect(VALID_EMOJIS).toContain("🎬");
    });

    it("should include crying with laughter 😂", () => {
      expect(VALID_EMOJIS).toContain("😂");
    });

    it("should include red heart ❤️", () => {
      expect(VALID_EMOJIS).toContain("❤️");
    });

    it("should include fire 🔥", () => {
      expect(VALID_EMOJIS).toContain("🔥");
    });

    it("should include astonished face 😮", () => {
      expect(VALID_EMOJIS).toContain("😮");
    });

    it("should include hundred points 💯", () => {
      expect(VALID_EMOJIS).toContain("💯");
    });

    it("should NOT contain legacy thumbs-up 👍 (replaced by 🎬)", () => {
      expect(VALID_EMOJIS).not.toContain("👍");
    });

    it("should NOT contain crying face 😢 (replaced by 💯)", () => {
      expect(VALID_EMOJIS).not.toContain("😢");
    });

    it("should NOT contain party popper 🎉 (replaced by 😮)", () => {
      expect(VALID_EMOJIS).not.toContain("🎉");
    });
  });
});
