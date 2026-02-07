import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createUser, getUser, updateUserLastLogin } from "./json-db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email || !account?.providerAccountId) {
        console.error("Missing required user data");
        return false;
      }

      try {
        // Check if user exists in our database
        const userId = account.providerAccountId;
        let dbUser = getUser(userId);

        if (!dbUser) {
          // Create new user in database
          dbUser = createUser(
            userId,
            user.email,
            user.name || user.email,
            user.image || undefined
          );
          console.log("Created new user:", dbUser.id);
        } else {
          // Update last login
          updateUserLastLogin(dbUser.id);
          console.log("Updated user login:", dbUser.id);
        }

        return true;
      } catch (error) {
        console.error("Sign in error:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.sub = account.providerAccountId || user?.id;
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin", // Redirect errors to sign-in page
  },
});
