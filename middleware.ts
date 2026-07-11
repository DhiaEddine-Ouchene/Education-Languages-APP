import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000").toLowerCase();

  // White-label: detect custom domain and pass it downstream so layouts can load branding
  if (host && host !== appDomain) {
    requestHeaders.set("x-brand-domain", host);
  }

  const { pathname } = req.nextUrl;
  const isProtected = ["/dashboard", "/learn", "/admin"].some((p) => pathname.startsWith(p));
  if (!isProtected) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = token.role as string;
  if (pathname.startsWith("/admin") && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/dashboard") && role !== "EDUCATOR") {
    return NextResponse.redirect(new URL(role === "SUPER_ADMIN" ? "/admin" : "/learn", req.url));
  }
  if (pathname.startsWith("/learn") && role === "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
