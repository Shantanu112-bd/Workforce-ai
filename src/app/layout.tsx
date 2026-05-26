import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'WorkForce AI — Curated AI Agents for Professionals',
  description: 'Automate your daily workflows with prebuilt AI agents. No prompt engineering required.',
  keywords: ['AI agents', 'workflow automation', 'productivity', 'resume optimizer', 'meeting notes'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="font-sans antialiased bg-bg text-text">
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
