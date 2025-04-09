import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcrypt";

export const options = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: {
          label: "Username",
          type: "text",
          placeholder: "Your username",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Your password",
        },
      },
      async authorize(credentials) {
        try {
          await dbConnect();

          if (!credentials?.username || !credentials?.password) {
            console.log("Missing username or password");
            return null;
          }

          const user = await User.findOne({
            name: credentials.username,
          }).select("+password");

          if (!user) {
            console.log("User not found");
            return null;
          }

          const isMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isMatch) {
            console.log("Password does not match");
            return null;
          }

          console.log("User authenticated successfully");
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signUp: "/signup",
    error: "/login",
    verifyRequest: "/login",
    newUser: "/signup",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle specific page redirects
      if (url.startsWith("/signup")) return `${baseUrl}/signup`;
      if (url.startsWith("/login")) return `${baseUrl}/login`;
      if (url.startsWith("/forget-password"))
        return `${baseUrl}/forget-password`;

      // Default redirect behavior
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "a-default-secure-secret-for-dev-only",
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",
};
