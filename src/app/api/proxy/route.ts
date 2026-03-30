import { NextRequest, NextResponse } from "next/server";

// Derive the Clerk Frontend API domain from the publishable key env var
function getClerkFrontendApi(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  try {
    const parts = key.split("_");
    if (parts.length >= 3) {
      const jsonPart = parts[2].replace(/-/g, "+").replace(/_/g, "/");
      const padded = jsonPart + "=".repeat((4 - (jsonPart.length % 4) % 4));
      const decoded = Buffer.from(padded, "base64").toString();
      return decoded;
    }
  } catch {}
  return "";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.search;
  const pathname = request.nextUrl.pathname.replace("/api/proxy", "");

  const clerkFrontendApi = getClerkFrontendApi();

  // Route JS bundles to Clerk CDN, API calls to Frontend API
  const targetHost = clerkFrontendApi;
  const url = `https://${targetHost}${pathname}${searchParams}`;

  const headers: Record<string, string> = {
    origin: request.headers.get("origin") || "",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
  };

  const cookie = request.headers.get("cookie") || "";
  if (cookie) headers["cookie"] = cookie;

  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "";

    const respHeaders: Record<string, string> = {
      "content-type": contentType || "text/plain",
      "cache-control": "no-cache",
      "access-control-allow-origin": "*",
    };

    response.headers.getSetCookie().forEach((cookie, i) => {
      const key = i === 0 ? "set-cookie" : `set-cookie-${i}`;
      respHeaders[key] = cookie;
    });

    return new NextResponse(data, {
      status: response.status,
      headers: respHeaders,
    });
  } catch (error) {
    console.error(`Proxy GET error for ${url}:`, error);
    return new NextResponse("Proxy error", { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.search;
  const pathname = request.nextUrl.pathname.replace("/api/proxy", "");

  const clerkFrontendApi = getClerkFrontendApi();
  const url = `https://${clerkFrontendApi}${pathname}${searchParams}`;
  const body = await request.arrayBuffer();

  const headers: Record<string, string> = {
    "content-type": request.headers.get("content-type") || "application/json",
    origin: request.headers.get("origin") || "",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
  };

  const cookie = request.headers.get("cookie") || "";
  if (cookie) headers["cookie"] = cookie;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });
    const data = await response.arrayBuffer();

    const respHeaders: Record<string, string> = {
      "content-type": response.headers.get("content-type") || "application/json",
    };

    response.headers.getSetCookie().forEach((cookie, i) => {
      const key = i === 0 ? "set-cookie" : `set-cookie-${i}`;
      respHeaders[key] = cookie;
    });

    return new NextResponse(data, {
      status: response.status,
      headers: respHeaders,
    });
  } catch (error) {
    console.error("Proxy POST error:", error);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
