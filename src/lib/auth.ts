import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { createUser, getUser, updateUserLastLogin, getUserInviteByEmail, acceptUserInvite } from "./json-db";

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

        // Existing user → allow
        if (dbUser) {
          updateUserLastLogin(dbUser.id);
          console.log("Updated user login:", dbUser.id);
          return true;
        }

        // New user → check for invite
        const invite = getUserInviteByEmail(user.email);

        if (!invite || invite.status !== 'pending') {
          // No invite → redirect to not-allowed page
          console.log("No invite found for:", user.email);
          return '/auth/not-allowed';
        }

        // Valid invite → create user and accept invite
        dbUser = createUser(
          userId,
          user.email,
          user.name || user.email,
          user.image || undefined,
          false // New users are never admin
        );
        acceptUserInvite(user.email);
        console.log("Created new user from invite:", dbUser.id);
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
