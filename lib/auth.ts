import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role, Stage } from "@/lib/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      stage: Stage;
      onboarded: boolean;
    } & DefaultSessionUser;
  }
  interface User {
    role?: Role;
    stage?: Stage;
    onboardedAt?: Date | null;
  }
}

type DefaultSessionUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    stage?: Stage;
    onboarded?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          stage: user.stage,
          onboardedAt: user.onboardedAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.stage = user.stage;
        token.onboarded = Boolean(user.onboardedAt);
      }
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
        });
        if (fresh) {
          token.role = fresh.role;
          token.stage = fresh.stage;
          token.onboarded = Boolean(fresh.onboardedAt);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? "STUDENT";
        session.user.stage = token.stage ?? "PLANTED";
        session.user.onboarded = token.onboarded ?? false;
      }
      return session;
    },
  },
});
