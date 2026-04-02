import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    // Aap chaho toh yahan Github, Email ya Credentials (Password) bhi daal sakte ho
  ],
  session: {
    strategy: "jwt", // 🔒 This is what creates the secure token we use in APIs!
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      if (session?.user && token.email) {
        session.user.email = token.email;
        // Optionally attach more token data to the session if needed
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
      }
      return token;
    }
  },
  // Custom pages if you have a custom login screen instead of default
  pages: {
    signIn: '/', // Redirects to home page if they try to access a protected route without logging in
  }
};

const handler = NextAuth(authOptions);

// Next.js App Router requires exporting GET and POST
export { handler as GET, handler as POST };