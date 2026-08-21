import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { GeistPixelGrid } from 'geist/font/pixel'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })

export const metadata: Metadata = {
  metadataBase: new URL('https://mindstate.avikmukherjee.com'),
  title: 'Mindstate — Private agent memory',
  description: 'Capture, search, and share durable context across agent sessions.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Mindstate — Private agent memory',
    description: 'Capture, search, and share durable context across agent sessions.',
    url: 'https://mindstate.avikmukherjee.com',
    siteName: 'Mindstate',
    type: 'website',
    images: [{
      url: '/mindstate-og.png',
      width: 1200,
      height: 630,
      alt: 'Mindstate — one place for agents to remember, work, and hand off',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mindstate — Private agent memory',
    description: 'Capture, search, and share durable context across agent sessions.',
    images: ['/mindstate-og.png'],
  },
  applicationName: 'Mindstate',
  generator: 'Mindstate',
  icons: {
    icon: [{ url: '/mindstate-icon-source.png', type: 'image/png' }],
    shortcut: '/mindstate-icon-source.png',
    apple: '/mindstate-icon-source.png',
  },
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#EFEBDF',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn('bg-background', jetbrainsMono.variable, GeistPixelGrid.variable)}>
      <body className="font-mono antialiased">
        <TooltipProvider>{children}</TooltipProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
