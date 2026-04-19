import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'
import Navbar from '@/components/Navbar'


export const metadata: Metadata = {
  title: 'Flashcard Engine — AI-Powered Learning',
  description: 'Turn any PDF into smart flashcards with spaced repetition',
  icons: { icon: '/icon.png' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        <link href="https://fonts.googleapis.com/css2?family=Pinyon+Script&display=swap" rel="stylesheet" />

      
      </head>
      <body className="bg-[#F2E8D5] text-[#1A1A1A] antialiased font-[Inter]">

        <Navbar />

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1C3D2E',
              color: '#F2E8D5',
              fontFamily: 'Inter, sans-serif',
              borderRadius: '999px',
              padding: '12px 18px',
            },
          }}
        />

        <main className="pt-16">
          {children}
        </main>

      </body>
    </html>
  )
}
