"use server";

import { db, users } from "@/db";
import { eq } from "drizzle-orm";

/**
 * Get a user's display name. If not yet in local cache, attempt one Clerk API sync.
 * Falls back to "Family Member" if Clerk call fails or user not in Clerk.
 * This is called per-member on dashboard load — Clerk API call is made only once per uncached user.
 */
export async function getUserDisplayName(clerkId: string): Promise<string> {
  try {
    const local = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (local?.firstName) {
      return local.firstName;
    }
  } catch {
    // Table may not exist yet (migration not run) — fall back to Clerk API directly
  }

  // Attempt one-time sync from Clerk
  try {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.getUser(clerkId);
    const firstName = clerkUser.firstName
      || clerkUser.primaryEmailAddress?.emailAddress?.split("@")[0]
      || null;

    if (firstName) {
      await upsertUser(clerkId, firstName, clerkUser.primaryEmailAddress?.emailAddress || undefined);
      return firstName;
    }
  } catch (err) {
    console.error("[getUserDisplayName] Clerk sync failed for", clerkId, err);
  }

  return "Family Member";
}

async function upsertUser(clerkId: string, firstName: string, email?: string): Promise<void> {
  try {
    const existing = await db.query.users.findFirst({ where: eq(users.clerkId, clerkId) });
    if (existing) {
      await db.update(users).set({ firstName, email: email || existing.email, updatedAt: new Date() }).where(eq(users.clerkId, clerkId));
    } else {
      await db.insert(users).values({ clerkId, firstName, email: email || null });
    }
  } catch {
    // Silently fail if table doesn't exist yet
  }
}
