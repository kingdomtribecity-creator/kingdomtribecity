import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ADMIN_AREA_ROLES } from "@/lib/permissions";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/learn",
  "/tribe",
  "/admin",
  "/onboarding",
];
const ADMIN_PREFIX = "/admin";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const user = req.auth?.user;
  if (!user) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (pathname.startsWith(ADMIN_PREFIX) && !ADMIN_AREA_ROLES.includes(user.role)) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  if (!user.onboarded && pathname !== "/onboarding") {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/tribe/:path*",
    "/admin/:path*",
    "/onboarding",
  ],
};
