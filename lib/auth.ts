import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { getServerSession } from "next-auth";

const isProd = process.env.NODE_ENV === "production";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days — shorter = smaller cookie
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      // Shorter names = smaller headers
      name: isProd ? "__Secure-ep.s" : "ep.s",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: isProd ? "__Secure-ep.cb" : "ep.cb",
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProd,
        maxAge: 60 * 5, // 5 min — only needed during auth flow
      },
    },
    csrfToken: {
      name: isProd ? "__Host-ep.csrf" : "ep.csrf",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
  pages: { signIn: "/auth/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user?.password) return null;
        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;
        if (!user.isVerified) throw new Error("UNVERIFIED");
        // Return only what we need — minimal
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (!existing) {
          const created = await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name ?? "User",
              image: user.image,
              role: "EDUCATOR",
              isVerified: true,
              educatorProfile: { create: { creatorType: "Teacher" } },
            },
          });
          user.id = created.id;
          (user as any).role = "EDUCATOR";
        } else {
          if (!existing.isVerified) {
            await prisma.user.update({ where: { id: existing.id }, data: { isVerified: true } });
          }
          user.id = existing.id;
          (user as any).role = existing.role;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // CRITICAL: Keep JWT payload as small as possible to avoid 494 header-too-large.
      // Only store id and role in the cookie. name/image come from DB in session callback.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "EDUCATOR";
      }
      // Remove any bloated fields NextAuth might add
      delete (token as any).picture;
      delete (token as any).name;
      delete (token as any).image;
      return token;
    },

    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as "SUPER_ADMIN" | "EDUCATOR" | "STUDENT";
        // Fetch name & image from DB (NOT stored in cookie to keep headers small).
        // Wrap in try/catch: a DB hiccup here must never throw and knock the
        // user back to the login screen on a reload.
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true },
          });
          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.image = dbUser.image;
          }
        } catch (e) {
          console.error("[auth:session] DB lookup failed:", e);
        }
      }
      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

export async function requireRole(role: "SUPER_ADMIN" | "EDUCATOR" | "STUDENT") {
  const session = await auth();
  if (!session?.user || session.user.role !== role) return null;
  return session;
}

export async function getEducatorProfile(userId: string) {
  return prisma.educatorProfile.findUnique({ where: { userId } });
}
