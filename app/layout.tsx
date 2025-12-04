import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import dynamic from "next/dynamic"

// Dynamic import for client-only components
const Toaster = dynamic(() => import("@/components/ui/toaster").then((mod) => ({ default: mod.Toaster })), {
  ssr: false,
})

const SonnerToaster = dynamic(() => import("@/components/ui/sonner").then((mod) => ({ default: mod.Toaster })), {
  ssr: false,
})

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Gispal - Audio Mixing SaaS Platform",
  description: "Professional audio mixing and jingle management platform",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} light`} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  )
}

