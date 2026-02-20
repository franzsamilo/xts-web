import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "@/lib/firebase/admin";

export const authOptions: NextAuthOptions = {
  adapter: FirestoreAdapter(adminDb as any),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt: async ({ token, user, profile }) => {
      if (user) {
        token.id = user.id;
      }
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
        // @ts-ignore
        token.picture = profile.picture || profile.image;
      }

      // Fetch the latest role from Firestore on EVERY JWT refresh.
      // This ensures role changes from the admin panel take effect immediately
      // without requiring the affected user to re-login.
      if (token.id) {
        try {
          const userDoc = await adminDb.collection('users').doc(token.id as string).get();
          if (userDoc.exists) {
            token.role = userDoc.data()?.role || 'member';
          } else {
            token.role = 'member';
          }
        } catch {
          if (!token.role) token.role = 'member';
        }
      }

      // Bootstrap: auto-promote the configured admin email on first login
      if (token.email === process.env.ADMIN_EMAIL && (!token.role || token.role === 'member')) {
        token.role = 'admin';
        if (token.id) {
          try {
            await adminDb.collection('users').doc(token.id as string).update({ role: 'admin' });
          } catch {
            // User doc may not exist yet on very first login
          }
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        // @ts-ignore
        session.user.id = token.id;
        // @ts-ignore
        session.user.image = token.picture;
        // @ts-ignore
        session.user.name = token.name;
        // @ts-ignore
        session.user.role = token.role || 'member';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
};
