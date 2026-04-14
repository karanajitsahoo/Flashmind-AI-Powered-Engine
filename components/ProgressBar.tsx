'use client'

interface ProgressBarProps {
  current: number
  total: number
  correct: number
}

export default function ProgressBar({ current, total, correct }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0
  const accuracy = current > 0 ? Math.round((correct / current) * 100) : 0

  return (
    <div className="w-full max-w-2xl">
      <div className="flex justify-between items-center mb-2 text-sm">
        <span className="text-ink-400 font-medium">
          {current} of {total} reviewed
        </span>
        <span className="text-ink font-semibold">{accuracy}% accuracy</span>
      </div>
      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-ink rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
