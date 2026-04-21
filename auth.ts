import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

// With JWT session strategy + only Credentials provider, we don't need
// the Prisma adapter — sessions live in signed JWT cookies, users live
// in our own `user` table managed by the app.

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      merchantId: string | null;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          // Extras picked up in the jwt callback.
          role: user.role,
          merchantId: user.merchantId,
        } as {
          id: string;
          email: string;
          name?: string;
          role: Role;
          merchantId: string | null;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { role?: Role; merchantId?: string | null };
        if (u.role) token.role = u.role;
        token.merchantId = u.merchantId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      if (token.role) session.user.role = token.role as Role;
      session.user.merchantId =
        (token.merchantId as string | null | undefined) ?? null;
      return session;
    },
  },
});
