import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.search;

  const frontendApi =
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL ||
    process.env.CLERK_FRONTEND_API_URL;
  if (!frontendApi) {
    return new NextResponse("Frontend API URL not set", { status: 500 });
  }

  const url = `https://${frontendApi}${searchParams}`;
  const headers: Record<string, string> = {
    origin: request.headers.get("origin") || "",
  };

  const cookie = request.headers.get("cookie") || "";
  if (cookie) headers["cookie"] = cookie;

  try {
    const response = await fetch(url, { headers });
    const data = await response.text();

    const respHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (["set-cookie", "content-type"].includes(key.toLowerCase())) {
        respHeaders[key] = value;
      }
    });

    return new NextResponse(data, { status: response.status, headers: respHeaders });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const searchParams = request.nextUrl.search;

  const frontendApi =
    process.env.NEXT_PUBLIC_CLERK_FRONTEND_API_URL ||
    process.env.CLERK_FRONTEND_API_URL;
  if (!frontendApi) {
    return new NextResponse("Frontend API URL not set", { status: 500 });
  }

  const url = `https://${frontendApi}${searchParams}`;
  const body = await request.text();

  const headers: Record<string, string> = {
    "content-type": request.headers.get("content-type") || "application/json",
    origin: request.headers.get("origin") || "",
  };

  const cookie = request.headers.get("cookie") || "";
  if (cookie) headers["cookie"] = cookie;

  try {
    const response = await fetch(url, { method: "POST", headers, body });
    const data = await response.text();

    const respHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      if (["set-cookie", "content-type"].includes(key.toLowerCase())) {
        respHeaders[key] = value;
      }
    });

    return new NextResponse(data, { status: response.status, headers: respHeaders });
  } catch {
    return new NextResponse("Proxy error", { status: 502 });
  }
}
