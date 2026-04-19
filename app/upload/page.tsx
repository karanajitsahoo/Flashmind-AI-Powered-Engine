'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import UploadBox from '@/components/UploadBox'
import { Cormorant_Garamond, Pinyon_Script, DM_Sans } from 'next/font/google'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})
const pinyon = Pinyon_Script({
  subsets: ['latin'],
  weight: ['400'],
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

type Step = 'idle' | 'uploading' | 'generating' | 'done'

const stepLabels: Record<Step, string> = {
  idle: '',
  uploading: 'Extracting text from PDF…',
  generating: 'AI is generating flashcards… (~30s)',
  done: 'Done! Redirecting…',
}

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [step, setStep] = useState<Step>('idle')
  const [progress, setProgress] = useState(0)

  const handleFile = (f: File) => {
    setFile(f)
    setStep('idle')
  }

  const handleGenerate = async () => {
    if (!file) return
    setStep('uploading')
    setProgress(10)

    try {
      const form = new FormData()
      form.append('pdf', file)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Upload failed')

      setProgress(40)
      setStep('generating')

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: uploadData.text, filename: uploadData.filename }),
      })
      const genData = await genRes.json()
      if (!genRes.ok) throw new Error(genData.error ?? 'Generation failed')

      setProgress(100)
      setStep('done')

      toast.success(`Generated ${genData.cardCount} practice cards + ${genData.learningCardCount ?? 0} learning cards!`)
      setTimeout(() => router.push(`/learn/${genData.deckId}`), 800)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      toast.error(message)
      setStep('idle')
      setProgress(0)
    }
  }

  const isProcessing = step === 'uploading' || step === 'generating'

  return (
    <div className={`min-h-screen bg-[#f4ede2] ${dmSans.className}`}>
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-16">

        {/* ── Page header ───────────────────────────────────────── */}
        <div className="mb-12">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <p className="text-[#C9A96E] text-[9px] tracking-[0.35em] uppercase font-light whitespace-nowrap">
              New Deck
            </p>
            <div className="flex-1 border-t border-dotted border-ink" />
          </div>

          <h1 className={`${cormorant.className} text-[#1C3D2E] leading-[0.95] mb-3`}
            style={{ fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 500 }}>
            Upload your
          </h1>
          <h1 className={`${pinyon.className} text-[#C9A96E] leading-[0.9] mb-6`}
            style={{ fontSize: 'clamp(3rem, 7vw, 5rem)' }}>
            material
          </h1>
          <p className="text-ink/45 text-sm font-light leading-relaxed">
            Drop a PDF and we'll turn it into a complete learning system —
            concepts, MCQs, and spaced repetition, all set up in seconds.
          </p>
        </div>

        <div className="space-y-4">

          {/* ── Drop zone ─────────────────────────────────────────── */}
          {/* UploadBox renders itself; we wrap it to apply consistent styling context */}
          <div className={`transition-opacity ${isProcessing ? 'opacity-40 pointer-events-none' : 'opacity-10'}`}>
            <UploadBox onFile={handleFile} disabled={isProcessing} />
          </div>

          {/* ── File preview ──────────────────────────────────────── */}
          {file && !isProcessing && (
            <div className="flex items-center gap-4 px-5 py-4 bg-[#EDE2CC] border border-[#D4C4A0] rounded-sm">
              {/* PDF icon */}
              <div className="w-9 h-9 bg-[#1C3D2E] rounded-sm flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="#C9A96E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`${cormorant.className} text-[#1C3D2E] text-lg leading-tight truncate`}>
                  {file.name}
                </p>
                <p className="text-[#A88850] text-[10px] tracking-[0.1em] mt-0.5">
                  {(file.size / 1024).toFixed(0)} KB · PDF
                </p>
              </div>

              <button
                onClick={() => setFile(null)}
                className="text-[#1C3D2E]/30 hover:text-[#1C3D2E]/70 transition-colors p-1 flex-shrink-0"
                aria-label="Remove file"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Processing state ───────────────────────────────────── */}
          {isProcessing && (
            <div className="border border-[#F2E8D5]/10 rounded-sm px-6 py-7">
              {/* Step label */}
              <div className="flex items-center gap-3 mb-5">
                {/* Animated dot */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A96E] opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A96E]" />
                </span>
                <p className="text-[#F2E8D5]/60 text-xs tracking-[0.1em] font-light">
                  {stepLabels[step]}
                </p>
              </div>

              {/* Progress track */}
              <div className="w-full h-px bg-[#F2E8D5]/10 relative">
                <div
                  className="absolute top-0 left-0 h-px bg-[#C9A96E] transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#C9A96E] rounded-full transition-all duration-700 ease-out"
                  style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>

              {/* Step indicators */}
              <div className="flex justify-between mt-4">
                {(['Uploading', 'Parsing', 'Generating', 'Done'] as const).map((label, i) => {
                  const thresholds = [10, 40, 70, 100]
                  const active = progress >= thresholds[i]
                  return (
                    <p key={label} className={`text-[9px] tracking-[0.15em] uppercase transition-colors ${
                      active ? 'text-[#C9A96E]' : 'text-[#F2E8D5]/15'
                    }`}>
                      {label}
                    </p>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Tips (shown when no file selected) ────────────────── */}
          {!file && !isProcessing && (
            <div className="border border-ink/20 rounded-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <p className="text-[#C9A96E] text-[11px] tracking-[0.3em] uppercase font-light whitespace-nowrap">
                  Tips for best results
                </p>
                <div className="flex-1 border-t border-ink/20" />
              </div>

              <div className="space-y-3.5">
                {[
                  'Use text-based PDFs, not scanned images',
                  'Lecture notes and textbook chapters work great',
                  'Files with clear headings produce better cards',
                  'Keep files under 10MB for best performance',
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[#8c764d]/40 text-[9px] mt-0.5 tracking-[0.1em] flex-shrink-0">
                      0{i + 1}
                    </span>
                    <p className="text-ink/40 text-sm font-light leading-snug">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Generate button ────────────────────────────────────── */}
          {file && !isProcessing && (
            <button
              onClick={handleGenerate}
              className="w-full py-4 bg-[#C9A96E] text-[#1C3D2E] text-[10px] tracking-[0.25em] uppercase font-medium rounded-sm hover:bg-[#D4B98A] transition-all duration-200"
            >
              Generate Flashcards →
            </button>
          )}

          {/* ── Done state ─────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="flex items-center gap-3 px-5 py-4 bg-[#2A5040] border border-[#4A7C5E]/40 rounded-sm">
              <svg className="w-4 h-4 text-[#4A7C5E] flex-shrink-0" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-[#F2E8D5]/70 text-xs tracking-[0.1em] font-light">
                Redirecting to your deck…
              </p>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}