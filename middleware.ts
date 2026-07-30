import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  const host = (req.headers.get("host") ?? "").toLowerCase();
  const appDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost:3000").toLowerCase();

  // White-label: detect custom domain
  if (host && host !== appDomain) {
    requestHeaders.set("x-brand-domain", host);
  }

  const { pathname } = req.nextUrl;
  const isProtected = ["/dashboard", "/learn", "/admin"].some((p) => pathname.startsWith(p));

  if (!isProtected) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Check if session cookie exists (quick check — full verification happens in page/API)
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-ep.session-token"
    : "ep.session-token";

  const sessionToken = req.cookies.get(cookieName)?.value;

  if (!sessionToken) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
