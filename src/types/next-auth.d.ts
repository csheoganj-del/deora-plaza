import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface User {
        id: string
        username: string
        role: string
        businessUnit: string
    }

    interface Session {
        user: User & DefaultSession["user"]
        firebaseToken?: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        username: string
        role: string
        businessUnit: string
        firebaseToken?: string
    }
}
