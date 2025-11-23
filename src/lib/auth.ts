import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { adminDb } from "@/lib/firebase/admin"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null
                }

                try {
                    const userDoc = await adminDb.collection('users').doc(credentials.username).get()

                    if (!userDoc.exists) {
                        return null
                    }

                    const user = userDoc.data()

                    if (!user) {
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    )

                    if (!isPasswordValid) {
                        return null
                    }

                    return {
                        id: user.id || userDoc.id,
                        username: user.username,
                        role: user.role,
                        businessUnit: user.businessUnit,
                        name: user.username,
                    }
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.role = token.role as string
                session.user.businessUnit = token.businessUnit as string
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.username = user.username
                token.role = user.role
                token.businessUnit = user.businessUnit
            }
            return token
        },
    },
}
