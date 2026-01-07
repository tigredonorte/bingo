import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Apple from "next-auth/providers/apple";
import type { NextAuthConfig, Session, User } from "next-auth";
import { z } from "zod";

/**
 * Schema for validating auth environment variables
 * All OAuth credentials are required for the auth system to function
 */
const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  FACEBOOK_CLIENT_ID: z.string().min(1, "FACEBOOK_CLIENT_ID is required"),
  FACEBOOK_CLIENT_SECRET: z.string().min(1, "FACEBOOK_CLIENT_SECRET is required"),
  APPLE_CLIENT_ID: z.string().min(1, "APPLE_CLIENT_ID is required"),
  APPLE_CLIENT_SECRET: z.string().min(1, "APPLE_CLIENT_SECRET is required"),
});

/**
 * Validated environment variables
 * Throws descriptive error at startup if any required env vars are missing
 */
function getValidatedEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid environment variables: ${missing}`);
  }
  return result.data;
}

const env = getValidatedEnv();

/**
 * Extended session type that includes user ID
 */
export interface ExtendedSession extends Session {
  user: Session["user"] & {
    id: string;
    provider?: string;
  };
}

/**
 * Auth configuration for NextAuth.js v5
 * Supports Google, Facebook, and Apple OAuth providers
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Facebook({
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
    }),
    Apple({
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          provider: account.provider,
        };
      }
      return token;
    },
    async session({ session, token }) {
      // Add user ID and provider to session
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as ExtendedSession["user"]).provider = token.provider as string;
      }
      return session as ExtendedSession;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to home after sign in
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
};

/**
 * Create NextAuth instance
 */
const nextAuth = NextAuth(authConfig);

/**
 * Export NextAuth handlers and utilities
 */
export const handlers = nextAuth.handlers;
export const signIn = nextAuth.signIn;
export const signOut = nextAuth.signOut;
export const auth = nextAuth.auth;

/**
 * Type exports for consumers
 */
export type { Session, User, NextAuthConfig };
