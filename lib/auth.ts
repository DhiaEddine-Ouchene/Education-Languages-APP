import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "./prisma";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
        
        // If the email is not verified, throw a distinct error to handle in frontend
        if (!user.isVerified) {
          throw new Error("UNVERIFIED");
        }
        
        return { id: user.id, email: user.email, name: user.name, image: user.avatar, role: user.role };
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
          const created = await prisma.user.create({
            data: {
              email: user.email.toLowerCase(),
              name: user.name ?? "User",
              avatar: user.image,
              role: "EDUCATOR",
              isVerified: true,
              educatorProfile: { create: { creatorType: "Teacher" } },
            },
          });
          user.id = created.id;
        } else {
          if (!existing.isVerified) {
            await prisma.user.update({
              where: { id: existing.id },
              data: { isVerified: true },
            });
          }
          user.id = existing.id;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id as string } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role as "SUPER_ADMIN" | "EDUCATOR" | "STUDENT";
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
