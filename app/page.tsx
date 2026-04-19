import Link from 'next/link'
import { DM_Sans, Cormorant_Garamond } from 'next/font/google'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})



export default function Home() {
  return (
    <main className={`min-h-screen bg-[#F2E8D5] ${dmSans.className}`}>
      {/* Hero */}
      <section className="min-h-[calc(100vh-64px)] flex items-start justify-center pt-24 md:pt-48 relative bg-[#1C3D2E]">


        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
          linear-gradient(rgba(242,232,213,0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(242,232,213,0.2) 1px, transparent 1px)
        `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 text-center -translate-y-8 md:-translate-y-12">

          {/* Label */}
          <p className="text-xs tracking-[0.25em] ${dmSans.className} font-light uppercase text-[#C9A96E] mb-8">
            AI-powered spaced repetition
          </p>

          {/* Heading */}
          <h1 className="text-6xl md:text-8xl text-[#F2E8D5] leading-tight">
            <span className="block font-serif tracking-[0.08em]">
              YOUR PATH TO
            </span>
            <span
              className="text-[#C9A96E]"
              style={{
                fontFamily: 'Pinyon Script, cursive',
                fontSize: '1.6em'
              }}
            >
              mastery
            </span>
            <span className="block font-serif tracking-[0.08em] mt-1">
              STARTS HERE
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#F2E8D5]/70 text-[14px] mt-10 mb-14 ${dmSans.className} tracking-[0.05em] font-light leading-relaxed">
            Upload your study materials and let AI generate high-quality flashcards.
            Then master them with spaced repetition.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-10 justify-center items-center mt-4">
            <Link
              href="/upload"
              className="bg-[#C9A96E] text-[#1C3D2E] px-10 py-3.5 text-sm ${dmSans.className} font-light uppercase tracking-[0.2em] rounded-sm hover:bg-[#D4B98A] transition-all duration-300"
            >
              Upload a PDF
            </Link>

            <Link
              href="/dashboard"
              className="border border-[#F2E8D5]/40 text-[#F2E8D5] px-8 py-3 text-sm ${dmSans.className} font-light uppercase tracking-widest rounded-sm hover:border-[#F2E8D5] transition-all duration-300"
            >
              View Dashboard
            </Link>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="min-h-[calc(100vh-144px)] bg-[#F2E8D5]">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="text-sm tracking-[0.3em] ${dmSans.className} font-light uppercase text-[#1C3D2E]/40 text-center mb-3">
            WHAT WE OFFER
          </p>

          <h2 className="text-5xl md:text-5xl font-serif text-[#1C3D2E] text-center leading-tight">
            Our philosophy
            <span
              className="block text-[#C9A96E] text-4xl md:text-6xl mb-3 → mb-4"
              style={{ fontFamily: 'Pinyon Script' }}
            >
              in every step
            </span>
          </h2>
          <div className="mt-12"></div>
          <div className="grid md:grid-cols-3 border border-[#1C3D2E]/30">
            {[
              { title: 'SM-2 Algorithm', desc: 'The same science-backed algorithm used by Anki. Intervals grow as you learn.' },
              { title: 'Quality Cards', desc: 'AI focuses on concepts, definitions, relationships — not random sentences.' },
              { title: 'Progress Tracking', desc: 'See accuracy, streak, and daily activity at a glance on your dashboard.' },
              { title: 'Active Recall System', desc: 'Questions are designed to force recall & not only recognition, hence improving long-term retention.' },
              { title: 'Mobile Ready', desc: 'Study on any device. Fully responsive from phone to desktop.' },
              { title: 'Instant Feedback Loop', desc: 'Get immediate explanations after every response to reinforce learning and correct mistakes instantly.' },
            ].map((f, i) => (
              <div
                key={i} 
                className={`p-8 
                  ${i % 3 !== 2 ? 'border-r' : ''} 
                  ${i < 3 ? 'border-b' : ''} 
                  border-[#1C3D2E]/20`}>
                <div>
                  <span className={`text-3xl ${cormorant.className} text-[#1C3D2E]/10 block mb-2`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h4 className={`${cormorant.className} text-lg text-[#1C3D2E]/90 mb-2`}>{f.title}</h4>
                  <p className="text-[#1C3D2E]/60 text-sm leading-relaxed ${dmSans.className} leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-8">
        <p className="text-center text-ink-300 text-sm">
          Flashcard Engine · Built with HTML, CSS, Next.js, Groq & MongoDB
        </p>
      </footer>
    </main>
  )
}
