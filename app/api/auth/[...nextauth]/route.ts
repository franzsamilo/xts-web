import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import { adminDb } from "@/lib/firebase/admin";

const handler = NextAuth({
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
        // @ts-ignore
        token.role = user.role || 'member';
      }
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
        // @ts-ignore
        token.picture = profile.picture || profile.image;
        
        // Manual promotion for the project owner (you)
        if (profile.email === process.env.ADMIN_EMAIL) {
          token.role = 'admin';
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
  }
});

export { handler as GET, handler as POST };
