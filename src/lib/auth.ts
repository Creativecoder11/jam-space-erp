import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// Demo users — work without a database connection
const DEMO_USERS = [
  { id: "demo-admin", email: "admin@jamspace.com", name: "Admin User", role: "SUPER_ADMIN", password: "password123" },
  { id: "demo-acc", email: "accountant@jamspace.com", name: "Accountant", role: "ACCOUNTANT", password: "password123" },
  { id: "demo-pm", email: "pm@jamspace.com", name: "Project Manager", role: "PROJECT_MANAGER", password: "password123" },
];

export const authOptions: NextAuthOptions = {
  // No adapter — using JWT-only sessions with CredentialsProvider
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Try demo users first (works without DB)
        const demoUser = DEMO_USERS.find((u) => u.email === credentials.email);
        if (demoUser && credentials.password === demoUser.password) {
          return { id: demoUser.id, email: demoUser.email, name: demoUser.name, role: demoUser.role };
        }

        // Fall through to real database
        try {
          const { prisma } = await import("./prisma");
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user || !user.isActive) return null;

          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) return null;

          return { id: user.id, email: user.email, name: user.name, role: user.role, image: user.avatar ?? undefined };
        } catch {
          // DB not available — only demo users work
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
};
