import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "ft_session";

const PUBLIC_PAGES = new Set(["/login", "/signup"]);
const PUBLIC_API_PREFIXES = ["/api/auth/"];

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

async function isAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return typeof payload.uid === "number";
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isApi = pathname.startsWith("/api/");
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
  const isPublicPage = PUBLIC_PAGES.has(pathname);

  if (isPublicApi) return NextResponse.next();

  const authed = await isAuthed(req);

  if (authed && isPublicPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (authed) return NextResponse.next();

  if (isApi) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isPublicPage) return NextResponse.next();

  const url = new URL("/login", req.url);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
