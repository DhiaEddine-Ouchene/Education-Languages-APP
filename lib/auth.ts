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
    maxAge: 30 * 24 * 60 * 60, // 30 days (long-lived, single cookie)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  cookies: {
    sessionToken: {
      name: "ep.session-token", // Simple name, no __Secure- prefix to avoid proxy issues
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    callbackUrl: {
      name: "ep.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProd,
        maxAge: 30 * 24 * 60 * 60,
      },
    },
    csrfToken: {
      name: "ep.csrf-token",
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
      credentials: { email: { label: "Email", type: "email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email.toLowerCase() } });
        if (!user?.password) return null;
        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;
        if (!user.isVerified) throw new Error("UNVERIFIED");
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
        const existing = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name ?? "User",
              image: user.image,
              role: "EDUCATOR",
              isVerified: true,
              educatorProfile: { create: { creatorType: "Teacher" } },
            },
          });
        } else {
          if (!existing.isVerified) {
            await prisma.user.update({ where: { id: existing.id }, data: { isVerified: true } });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.picture = user.image;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role as "SUPER_ADMIN" | "EDUCATOR" | "STUDENT";
        session.user.image = (token.picture as string) ?? null;
        session.user.name = (token.name as string) ?? null;
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
