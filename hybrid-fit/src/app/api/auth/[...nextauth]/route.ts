import NextAuth, { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectToDatabase } from "@/lib/mongodb";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
    // session strategy
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 1 day
    },

    // pages options (optional - customize auth pages)
    pages: {
        signIn: "/signin", // Custom login page
        error: "/signin", // Error page
    },

    // authentication providers
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            // background sign-in verification
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password required");
                }

                await connectToDatabase();

                const user = await User.findOne({
                    email: credentials.email
                }).select('+passwordHash');

                if (!user) {
                    throw new Error("No user found with this email");
                }

                // verify password
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash
                );

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                // return user object for JWT
                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                };
            },
        }),
    ],

    // callback configurations
    callbacks: {
        // JWT callback: runs when JWT is created or updated
        async jwt({ token, user }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },

        // returns session details to client
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };