import NextAuth, { NextAuthOptions } from 'next-auth'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Custom adapter to handle name field issue
const customPrismaAdapter = {
  ...PrismaAdapter(prisma),
  createUser: async (data: any) => {
    return await prisma.user.create({
      data: {
        ...data,
        name: data.name || 'User' // Ensure name is always provided
      }
    })
  }
}

export const authOptions: NextAuthOptions = {
  adapter: customPrismaAdapter,
  providers: [
    EmailProvider({
      server: {
        host: 'smtp.resend.com',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.RESEND_API_KEY || '',
        },
      },
      from: 'onboarding@resend.dev', // Use Resend's verified domain for now
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        // Log the email for debugging
        console.log('=== MAGIC LINK EMAIL ===')
        console.log('To:', identifier)
        console.log('URL:', url)
        console.log('========================')

        // Check if it's a real email domain
        const isRealEmail = !identifier.includes('@local.test') &&
                           !identifier.includes('@example.com') &&
                           !identifier.includes('@test.com')

        if (!isRealEmail) {
          console.log('📧 Skipping email send for test domain, showing magic link:')
          console.log('🔗 Magic link URL:', url)
          return
        }

        // Send real email using Resend API directly
        try {
          // For now, send to your verified email and include the target email in the subject
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RESEND_API_KEY || ''}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'onboarding@resend.dev',
              to: 'actionbias@mh31.com', // Send to your verified email
              subject: `Action Bias Sign In - For ${identifier}`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h2 style="color: #1f2937; margin: 0 0 10px 0;">Action Bias Sign In</h2>
                    <p style="color: #6b7280; margin: 0;">Magic link for: <strong>${identifier}</strong></p>
                  </div>

                  <div style="background: white; padding: 30px; border-radius: 8px; border: 1px solid #e5e7eb;">
                    <p style="color: #374151; margin: 0 0 20px 0;">
                      Click the button below to sign in to Action Bias:
                    </p>

                    <a href="${url}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                      Sign In Securely
                    </a>

                    <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                      This link will expire in 10 minutes for your security.
                    </p>

                    <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                      This is a temporary solution while domain verification is in progress.
                    </p>
                  </div>
                </div>
              `,
            }),
          })

          if (response.ok) {
            const result = await response.json()
            console.log('✅ Email sent successfully to actionbias@mh31.com')
            console.log('📧 Email ID:', result.id)
            console.log('📧 Magic link URL:', url)
          } else {
            const error = await response.json()
            console.error('❌ Email sending failed:', error)
            console.log('📧 Magic link URL:', url)
          }
        } catch (error) {
          console.error('❌ Email sending failed:', error)
          console.log('📧 Magic link URL:', url)
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.email = token.email as string
      }
      return session
    },
    async signIn({ user }) {
      // Ensure new users have a name
      if (user && !user.name) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { name: 'User' }
          })
        } catch (error) {
          console.error('Failed to update user name:', error)
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions) 