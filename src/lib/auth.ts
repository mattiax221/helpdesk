import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
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

        const code = parsed.data.classCode.trim().toUpperCase();
        const classroom = await prisma.classroom.findUnique({ where: { code } });
        if (!classroom) return null;

        const firstName = parsed.data.firstName.trim();
        const lastName = parsed.data.lastName.trim();
        const displayName = `${firstName} ${lastName}`;

        let user = await prisma.user.findFirst({
          where: {
            firstName: { equals: firstName },
            lastName: { equals: lastName },
            memberships: { some: { classroomId: classroom.id } },
          },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              firstName,
              lastName,
              name: displayName,
              role: "STUDENT",
              memberships: {
                create: { classroomId: classroom.id },
              },
            },
          });
        } else {
          await prisma.classroomMembership.upsert({
            where: {
              classroomId_userId: {
                classroomId: classroom.id,
                userId: user.id,
              },
            },
            update: {},
            create: { classroomId: classroom.id, userId: user.id },
          });
        }

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
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        } else if (token.id) {
          await prisma.user.update({
            where: { id: token.id as string },
            data: { role: "TEACHER" },
          });
          token.role = "TEACHER";
        }
      }
      if (account?.access_token) {
        token.googleAccessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) || "STUDENT";
        session.googleAccessToken = token.googleAccessToken as string | undefined;
      }
      return session;
    },
  },
  trustHost: true,
});

export const isGoogleAuthEnabled = googleConfigured;
