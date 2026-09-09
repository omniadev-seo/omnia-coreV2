import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getMember } from "@/config/members";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: { signIn: "/login" },
  callbacks: {
    signIn({ profile }) {
      return getMember(profile?.email) !== null;
    },
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
});