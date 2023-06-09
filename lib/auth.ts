import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { confirmPasswordHash } from '@/lib/confirmPasswordHash'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'credentials',
      type: 'credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
        },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any) {
        try {
          const user = await db.user.findFirst({
            where: {
              email: credentials.email,
            },
          })

          if (user !== null) {
            const res = await confirmPasswordHash(
              credentials.password,
              user.password,
            )
            if (res) {
              return user
            } else {
              throw new Error('Wrong password')
            }
          } else {
            throw new Error('User not found')
          }
        } catch (err: any) {
          throw new Error(`Authorize error: ${err.message}`)
        }
      },
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      if (token && session?.user) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.image
      }

      return session
    },
    async jwt({ token, user }) {
      if (token && token.email) {
        const dbUser = await db.user.findFirst({
          where: {
            email: token.email,
          },
        })

        if (!dbUser) {
          if (user) {
            token.id = user?.id
          }
          return token
        }

        return {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.image,
        }
      }
      return token
    },
  },
}
