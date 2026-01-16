import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"
import { UserRole } from "@prisma/client"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            studentProfile: true,
            teacherProfile: true,
            staffProfile: true,
            parent: true
          }
        })

        if (!user) {
          throw new Error("Invalid credentials")
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated")
        }

        if (!user.password) {
          throw new Error("Password not set for this account")
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password)

        if (!isValidPassword) {
          throw new Error("Invalid credentials")
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          image: user.avatar
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60
  },
  jwt: {
    maxAge: 15 * 60,
    secret: process.env.NEXTAUTH_SECRET
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error"
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
        token.name = user.name
      }

      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.email = token.email as string
        session.user.name = token.name as string
      }

      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    }
  },
  events: {
    async signIn({ user }) {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "SIGN_IN",
          entity: "User",
          entityId: user.id,
          details: `User ${user.email} signed in`
        }
      })
    },
    async signOut({ token }) {
      await prisma.auditLog.create({
        data: {
          userId: token?.id as string,
          action: "SIGN_OUT",
          entity: "User",
          entityId: token?.id as string,
          details: `User ${token?.email} signed out`
        }
      })
    }
  }
}
