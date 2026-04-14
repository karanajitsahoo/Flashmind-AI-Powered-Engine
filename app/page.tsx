import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-cream grain">
      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1" fill="#f9f7f3"/>
              <rect x="9" y="1" width="6" height="6" rx="1" fill="#f9f7f3" opacity="0.5"/>
              <rect x="1" y="9" width="6" height="6" rx="1" fill="#f9f7f3" opacity="0.5"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="#f9f7f3"/>
            </svg>
          </div>
          <span className="font-display text-lg text-ink">Flashcard Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="px-4 py-2 text-sm text-ink-500 hover:text-ink transition-colors">
            Dashboard
          </Link>
          <Link href="/upload" className="px-4 py-2 bg-ink text-cream rounded-lg text-sm font-medium hover:bg-accent transition-colors">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-accent-light border border-accent/20 rounded-full text-sm text-accent font-medium mb-8">
          <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
          AI-powered spaced repetition
        </div>

        <h1 className="font-display text-5xl md:text-7xl text-ink mb-6 leading-tight">
          Turn any PDF into
          <span className="block text-accent italic">smart flashcards</span>
        </h1>

        <p className="text-ink-500 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Upload your study materials and let AI generate high-quality flashcards. 
          Then master them with the proven SM-2 spaced repetition algorithm.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
          <Link
            href="/upload"
            className="px-8 py-4 bg-ink text-cream rounded-xl text-base font-semibold hover:bg-accent transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            Upload a PDF →
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-white border border-ink-200 text-ink rounded-xl text-base font-semibold hover:border-ink-400 transition-all duration-200"
          >
            View dashboard
          </Link>
        </div>
        <p className="text-ink-300 text-sm">No account needed · Free to use</p>
      </section>

      {/* Flow diagram */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Upload PDF',
              desc: 'Drop any study material — textbook chapters, lecture notes, research papers.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
              ),
            },
            {
              step: '02',
              title: 'AI Generates Cards',
              desc: 'GPT-4 extracts definitions, concepts, relationships and edge cases into flashcards.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              ),
            },
            {
              step: '03',
              title: 'Study & Retain',
              desc: 'Review with spaced repetition. Cards due when memory fades — not before, not after.',
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              ),
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-ink-100 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-ink-50 rounded-xl flex items-center justify-center text-ink-500">
                  {item.icon}
                </div>
                <span className="font-mono text-3xl font-bold text-ink-100">{item.step}</span>
              </div>
              <h3 className="font-display text-xl text-ink mb-2">{item.title}</h3>
              <p className="text-ink-400 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-ink-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2 className="font-display text-3xl md:text-4xl text-ink text-center mb-12">
            Built for serious learners
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🧠', title: 'SM-2 Algorithm', desc: 'The same science-backed algorithm used by Anki. Intervals grow as you learn.' },
              { icon: '✨', title: 'Quality Cards', desc: 'AI focuses on concepts, definitions, relationships — not random sentences.' },
              { icon: '📊', title: 'Progress Tracking', desc: 'See accuracy, streak, and daily activity at a glance on your dashboard.' },
              { icon: '🔄', title: 'Flip Animation', desc: 'Satisfying card flip reveals the answer. Muscle memory included.' },
              { icon: '📱', title: 'Mobile Ready', desc: 'Study on any device. Fully responsive from phone to desktop.' },
              { icon: '🔥', title: 'Streak Counter', desc: 'Daily streaks keep you consistent. Miss a day and the chain breaks.' },
            ].map((f, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-2xl shrink-0">{f.icon}</span>
                <div>
                  <h4 className="font-semibold text-ink mb-1">{f.title}</h4>
                  <p className="text-ink-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-4xl text-ink mb-4">Ready to start learning?</h2>
        <p className="text-ink-400 mb-8">Upload your first PDF and have flashcards in under 60 seconds.</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-8 py-4 bg-accent text-cream rounded-xl text-base font-semibold hover:bg-accent-hover transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          Upload PDF now →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100 py-8">
        <p className="text-center text-ink-300 text-sm">
          Flashcard Engine · Built with Next.js, OpenAI & MongoDB
        </p>
      </footer>
    </main>
  )
}
