import { NextRequest, NextResponse } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/workouts",
  "/health_products",
  "/body_metrics",
  "/symptoms",
  "/settings",
];

export function middleware(request: NextRequest) {
  const authenticated = request.cookies.has("access_token");
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (isProtected && !authenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
