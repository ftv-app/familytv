/**
 * POST /api/suggestions — Smart suggestions via embedding microservice.
 *
 * Body: { type: "auto_tag" | "smart_album" | "memories", family_id: string, item_id?: string }
 * Returns: { suggestions: [{ id, text, score, type }] }
 *
 * Security: Validates family_id from Clerk auth (server-side).
 * Graceful degradation: returns { suggestions: [], error: "..." } if service is down.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, familyMemberships } from "@/db";

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL ?? "http://localhost:8080";

export const dynamic = "force-dynamic";

type SuggestionType = "auto_tag" | "smart_album" | "memories";

const VALID_TYPES: SuggestionType[] = ["auto_tag", "smart_album", "memories"];

interface SuggestionResult {
  id: string;
  text: string;
  score: number;
  type: string;
}

interface SuggestionsResponse {
  suggestions: SuggestionResult[];
  error?: string;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, family_id, item_id } = body as {
    type?: string;
    family_id?: string;
    item_id?: string;
  };

  if (!type || !VALID_TYPES.includes(type as SuggestionType)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  if (!family_id || typeof family_id !== "string") {
    return NextResponse.json({ error: "family_id is required" }, { status: 400 });
  }

  // Verify family membership (server-side auth validation)
  const membership = await db.query.familyMemberships.findFirst({
    where: and(
      eq(familyMemberships.userId, userId),
      eq(familyMemberships.familyId, family_id)
    ),
  });

  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this family" },
      { status: 403 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const serviceRes = await fetch(`${EMBEDDING_SERVICE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "", // empty query for type-based suggestions
        family_id,
        limit: 10,
        type,
        ...(item_id ? { item_id } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!serviceRes.ok) {
      console.error("Embedding service returned:", serviceRes.status);
      const response: SuggestionsResponse = {
        suggestions: [],
        error: "service unavailable",
      };
      return NextResponse.json(response);
    }

    const serviceData = await serviceRes.json() as {
      results?: Array<{ id: string; text: string; score: number; type?: string }>;
      error?: string;
    };

    const response: SuggestionsResponse = {
      suggestions: (serviceData.results ?? []).map((r) => ({
        id: r.id,
        text: r.text,
        score: r.score,
        type: r.type ?? type,
      })),
      ...(serviceData.error ? { error: serviceData.error } : {}),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Suggestions route error:", err);
    // Graceful degradation — NOT a 500 error
    const response: SuggestionsResponse = {
      suggestions: [],
      error: "service unavailable",
    };
    return NextResponse.json(response);
  }
}
