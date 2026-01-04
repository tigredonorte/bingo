import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Apple from "next-auth/providers/apple";
import type { NextAuthConfig, Session, User } from "next-auth";

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
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
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
