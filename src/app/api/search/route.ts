/**
 * POST /api/search — Semantic search via embedding microservice.
 *
 * Body: { query: string, family_id: string, limit?: number, type?: string }
 * Returns: { results: [{ id, text, score, type }] }
 *
 * Security: Validates family_id from Clerk auth (server-side).
 * Graceful degradation: returns { results: [], error: "..." } if service is down.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, familyMemberships } from "@/db";

const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL ?? "http://localhost:8080";

export const dynamic = "force-dynamic";

interface SearchResult {
  id: string;
  text: string;
  score: number;
  type: string;
}

interface SearchResponse {
  results: SearchResult[];
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

  const { query, family_id, limit = 20, type } = body as {
    query?: string;
    family_id?: string;
    limit?: number;
    type?: string;
  };

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
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

  const safeLimit = Math.min(Math.max(1, Math.floor(limit ?? 20)), 50);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const serviceRes = await fetch(`${EMBEDDING_SERVICE_URL}/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: query.trim(),
        family_id,
        limit: safeLimit,
        ...(type ? { type } : {}),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!serviceRes.ok) {
      console.error("Embedding service returned:", serviceRes.status);
      const response: SearchResponse = {
        results: [],
        error: "service unavailable",
      };
      return NextResponse.json(response);
    }

    const serviceData = await serviceRes.json() as {
      results?: Array<{ id: string; text: string; score: number; type?: string }>;
      error?: string;
    };

    const response: SearchResponse = {
      results: (serviceData.results ?? []).map((r) => ({
        id: r.id,
        text: r.text,
        score: r.score,
        type: r.type ?? "unknown",
      })),
      ...(serviceData.error ? { error: serviceData.error } : {}),
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Search route error:", err);
    // Graceful degradation — NOT a 500 error
    const response: SearchResponse = {
      results: [],
      error: "service unavailable",
    };
    return NextResponse.json(response);
  }
}
