import type { Metadata } from 'next'
import { Toaster } from 'react-hot-toast'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flashcard Engine — AI-Powered Learning',
  description: 'Turn any PDF into smart flashcards with spaced repetition',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-cream text-ink antialiased">
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#0f0e0d',
              color: '#f9f7f3',
              fontFamily: 'DM Sans, sans-serif',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
        {children}
      </body>
    </html>
  )
}
