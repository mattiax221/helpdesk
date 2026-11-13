import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { teacherEmailAllowlist } from "@/lib/authz";

const classLoginSchema = z.object({
  mode: z.literal("class"),
  classCode: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

const emailLoginSchema = z.object({
  mode: z.literal("email"),
  email: z.string().email(),
  password: z.string().min(4),
});

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) && Boolean(process.env.GOOGLE_CLIENT_SECRET);

const useSecureCookies =
  process.env.VERCEL === "1" ||
  process.env.NODE_ENV === "production" ||
  (process.env.AUTH_URL ?? "").startsWith("https://");

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Credentials + JWT: avoid DB sessions from the adapter interfering on serverless.
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  useSecureCookies,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(googleConfigured
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
              params: {
                scope: [
                  "openid",
                  "email",
                  "profile",
                  "https://www.googleapis.com/auth/classroom.courses.readonly",
                  "https://www.googleapis.com/auth/classroom.rosters.readonly",
                  // Invio avvisi scadenze dal Gmail Workspace del docente
                  // (mittente interno al dominio scuola → non bloccato dal filtro).
                  "https://www.googleapis.com/auth/gmail.send",
                ].join(" "),
                access_type: "offline",
                prompt: "consent",
              },
            },
          }),
        ]
      : []),
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        mode: { label: "mode", type: "text" },
        email: { label: "email", type: "email" },
        password: { label: "password", type: "password" },
        classCode: { label: "classCode", type: "text" },
        firstName: { label: "firstName", type: "text" },
        lastName: { label: "lastName", type: "text" },
      },
      async authorize(raw) {
        const mode = raw?.mode === "email" ? "email" : "class";

        if (mode === "email") {
          const parsed = emailLoginSchema.safeParse({
            mode: "email",
            email: raw?.email,
            password: raw?.password,
          });
          if (!parsed.success) return null;

          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email.toLowerCase() },
          });
          if (!user?.passwordHash) return null;
          const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
          if (!ok) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
          };
        }

        const parsed = classLoginSchema.safeParse({
          mode: "class",
          classCode: raw?.classCode,
          firstName: raw?.firstName,
          lastName: raw?.lastName,
        });
        if (!parsed.success) return null;

        const code = parsed.data.classCode
          .trim()
          .toUpperCase()
          .replace(/[\u2013\u2014]/g, "-")
          .replace(/\s+/g, "");
        const classroom = await prisma.classroom.findUnique({ where: { code } });
        if (!classroom) return null;

        const firstName = parsed.data.firstName.trim();
        const lastName = parsed.data.lastName.trim();
        const displayName = `${firstName} ${lastName}`;
        const firstKey = firstName.toLocaleLowerCase("it");
        const lastKey = lastName.toLocaleLowerCase("it");

        // Roster-only join; match names case-insensitively (SQLite equals is case-sensitive).
        const members = await prisma.classroomMembership.findMany({
          where: { classroomId: classroom.id, user: { role: "STUDENT" } },
          include: { user: true },
        });
        const user =
          members.find((m) => {
            const f = (m.user.firstName || "").toLocaleLowerCase("it");
            const l = (m.user.lastName || "").toLocaleLowerCase("it");
            const full = (m.user.name || "").toLocaleLowerCase("it");
            return (
              (f === firstKey && l === lastKey) ||
              full === `${firstKey} ${lastKey}`
            );
          })?.user ?? null;
        if (!user) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? displayName,
          image: user.image,
          role: user.role as Role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: Role }).role ?? "STUDENT";
      }

      if (account?.provider === "google" && token.email) {
        const email = String(token.email).toLowerCase();
        const dbUser = await prisma.user.findUnique({ where: { email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        } else if (token.id) {
          // New Google users stay STUDENT unless explicitly allowlisted as teachers.
          const allow = teacherEmailAllowlist();
          const role: Role = allow.has(email) ? "TEACHER" : "STUDENT";
          await prisma.user.update({
            where: { id: token.id as string },
            data: { role, email },
          });
          token.role = role;
        }
      }

      // OAuth access tokens stay in the Account table — never on the JWT/session.
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) || "STUDENT";
      }
      return session;
    },
  },
});

export const isGoogleAuthEnabled = googleConfigured;
