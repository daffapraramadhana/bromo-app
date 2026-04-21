import { NextRequest, NextResponse } from "next/server";

// Subdomain-aware routing:
//   merchant.<root>  → /(merchant)/*
//   <root>           → /(admin)/*
//
// Route groups in `app/` are invisible in the URL, so we rewrite the
// request path to the appropriate segment. Auth + _next + api are passed
// through untouched.

const MERCHANT_SUB = process.env.NEXT_PUBLIC_MERCHANT_SUBDOMAIN ?? "merchant";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let Next internals, api, and auth screens pass through.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/login") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const isMerchant = hostname.startsWith(`${MERCHANT_SUB}.`);

  const url = req.nextUrl.clone();
  url.pathname = isMerchant ? `/merchant${pathname}` : `/admin${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
