import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import argon2 from "argon2";

import { prisma } from "@/server/db";

type Role = "ADMIN" | "USER";

type AuthUser = {
  id: string;
  name: string;
  role: Role;
};

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.trim();
        const password = credentials?.password ?? "";

        if (!username || !password) return null;

        const user = await prisma.user.findFirst({
          where: {
            username,
            deletedAt: null,
          },
          select: {
            id: true,
            username: true,
            role: true,
            isActive: true,
            passwordHash: true,
          },
        });

        if (!user || !user.isActive) return null;
        const ok = await argon2.verify(user.passwordHash, password);
        if (!ok) return null;

        const authUser: AuthUser = {
          id: user.id,
          name: user.username,
          role: user.role,
        };

        return authUser;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as AuthUser;
        token.sub = u.id;
        (token as { role?: Role }).role = u.role;
        token.name = u.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token as { role?: Role }).role ?? "USER";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
