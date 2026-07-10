import { NextRequest, NextResponse } from "next/server";

// Simple token-based auth: Firebase sets a cookie named __session when signed in.
// For deeper server-side verification you'd validate the ID token with firebase-admin,
// but for a personal admin dashboard this cookie presence check is sufficient.
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin")) return NextResponse.next();
  if (pathname === "/admin/login") return NextResponse.next();

  // Check for Firebase auth cookie
  const session = req.cookies.get("__session")?.value;
  if (!session) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
