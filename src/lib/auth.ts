import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { adminDb, adminAuth } from "@/lib/firebase/admin"
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
                        const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME
                        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD

                        if (
                            defaultUsername &&
                            defaultPassword &&
                            credentials.username === defaultUsername &&
                            credentials.password === defaultPassword
                        ) {
                            const hashed = await bcrypt.hash(defaultPassword, 10)
                            await adminDb.collection('users').doc(defaultUsername).set({
                                username: defaultUsername,
                                authMethod: 'password',
                                password: hashed,
                                role: 'super_admin',
                                businessUnit: 'all',
                                name: defaultUsername,
                                isActive: true,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                mustChangePassword: true,
                                loginCount: 0,
                                failedLoginCount: 0
                            }, { merge: true })

                            return {
                                id: defaultUsername,
                                username: defaultUsername,
                                role: 'super_admin',
                                businessUnit: 'all',
                                name: defaultUsername,
                            }
                        }

                        return null
                    }

                    const user = userDoc.data()

                    if (!user) {
                        return null
                    }

                    if (user.isActive === false) {
                        return null
                    }

                    const now = new Date()
                    if (user.lockedUntil) {
                        const lockedUntilDate = new Date(user.lockedUntil)
                        if (lockedUntilDate > now) {
                            return null
                        }
                    }

                    if (!user.password) {
                        const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME
                        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD

                        if (
                            defaultUsername &&
                            defaultPassword &&
                            credentials.username === defaultUsername &&
                            credentials.password === defaultPassword
                        ) {
                            const hashed = await bcrypt.hash(defaultPassword, 10)
                            await adminDb.collection('users').doc(defaultUsername).set({
                                authMethod: 'password',
                                password: hashed,
                                updatedAt: new Date()
                            }, { merge: true })

                            return {
                                id: user.id || userDoc.id,
                                username: defaultUsername,
                                role: user.role || 'super_admin',
                                businessUnit: user.businessUnit || 'all',
                                name: defaultUsername,
                            }
                        }
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.password
                    )

                    if (!isPasswordValid) {
                        try {
                            const failed = (user.failedLoginCount || 0) + 1
                            const update: any = { failedLoginCount: failed, lastFailedLoginAt: now }
                            if (failed >= 5) {
                                update.lockedUntil = new Date(now.getTime() + 15 * 60 * 1000)
                            }
                            await adminDb.collection('users').doc(userDoc.id).set(update, { merge: true })
                        } catch {}
                        return null
                    }

                    try {
                        await adminDb.collection('users').doc(userDoc.id).set({
                            lastLoginAt: now,
                            loginCount: (user.loginCount || 0) + 1,
                            failedLoginCount: 0,
                            updatedAt: now,
                            lastLoginSource: 'web',
                            devices: {
                                web: {
                                    platform: 'web',
                                    lastSeenAt: now
                                }
                            }
                        }, { merge: true })
                    } catch {}

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
                session.firebaseToken = token.firebaseToken as string
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

            // Generate Firebase custom token if it doesn't exist
            if (!token.firebaseToken && token.id) {
                try {
                    const firebaseToken = await adminAuth.createCustomToken(token.id as string, {
                        role: token.role,
                        businessUnit: token.businessUnit
                    })
                    token.firebaseToken = firebaseToken
                } catch (error) {
                    console.error("Error creating custom token:", error)
                }
            }

            return token
        },
    },
}
