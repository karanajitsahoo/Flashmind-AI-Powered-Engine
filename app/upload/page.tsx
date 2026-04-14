'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import UploadBox from '@/components/UploadBox'

type Step = 'idle' | 'uploading' | 'generating' | 'done'

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
      // 1. Upload and parse PDF
      const form = new FormData()
      form.append('pdf', file)

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) throw new Error(uploadData.error ?? 'Upload failed')

      setProgress(40)
      setStep('generating')

      // Call the real AI generation endpoint
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

  const stepLabels: Record<Step, string> = {
    idle: '',
    uploading: 'Extracting text from PDF…',
    generating: 'AI is generating flashcards… (this takes ~30s)',
    done: 'Done! Redirecting…',
  }

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="font-display text-4xl text-ink mb-3">Upload a PDF</h1>
          <p className="text-ink-400 text-lg">
            We'll extract the content and generate high-quality flashcards using AI.
          </p>
        </div>

        <div className="space-y-6">
          <UploadBox onFile={handleFile} disabled={isProcessing} />

          {/* File preview */}
          {file && !isProcessing && (
            <div className="animate-slide-up flex items-center gap-4 p-4 bg-white rounded-xl border border-ink-100 shadow-card">
              <div className="w-10 h-10 bg-ink-50 rounded-lg flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-ink-400">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ink font-medium text-sm truncate">{file.name}</p>
                <p className="text-ink-400 text-xs">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-ink-300 hover:text-ink transition-colors p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div className="animate-fade-in space-y-3">
              <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-ink rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-ink-500">{stepLabels[step]}</p>
              </div>
            </div>
          )}

          {/* Tips */}
          {!file && !isProcessing && (
            <div className="animate-fade-in bg-ink-50 rounded-xl p-5 space-y-2">
              <p className="text-sm font-semibold text-ink">Tips for best results</p>
              <ul className="space-y-1.5 text-sm text-ink-400">
                <li className="flex gap-2"><span className="text-accent">→</span> Use text-based PDFs (not scanned images)</li>
                <li className="flex gap-2"><span className="text-accent">→</span> Lecture notes and textbook chapters work great</li>
                <li className="flex gap-2"><span className="text-accent">→</span> Files with clear headings produce better cards</li>
                <li className="flex gap-2"><span className="text-accent">→</span> Keep files under 10MB for best performance</li>
              </ul>
            </div>
          )}

          {/* Generate button */}
          {file && !isProcessing && (
            <button
              onClick={handleGenerate}
              className="animate-slide-up w-full py-4 bg-ink text-cream rounded-xl font-semibold text-base hover:bg-accent transition-all duration-200 hover:shadow-lg"
            >
              Generate Flashcards →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
