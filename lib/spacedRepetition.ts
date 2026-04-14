export interface SM2Card {
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
}

export interface SM2Result extends SM2Card {
  wasCorrect: boolean
}

/**
 * SM-2 Spaced Repetition Algorithm
 * Rating scale: 0-5
 * 0-1: Again (complete blackout / incorrect)
 * 2-3: Hard (correct with difficulty)
 * 4: Good (correct with hesitation)
 * 5: Easy (perfect recall)
 */
export function calculateNextReview(card: SM2Card, rating: number): SM2Result {
  const wasCorrect = rating >= 2

  let { easeFactor, interval, repetitions } = card

  if (wasCorrect) {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
    easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
  } else {
    // Failed — reset repetitions and short interval
    repetitions = 0
    interval = 1
    // Ease factor decreases slightly on failure
    easeFactor = Math.max(1.3, easeFactor - 0.2)
  }

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + interval)

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    wasCorrect,
  }
}

export function getDefaultSM2(): SM2Card {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date(),
  }
}

export function isDueForReview(card: SM2Card): boolean {
  return new Date(card.nextReviewDate) <= new Date()
}

export function getDifficultyLabel(rating: number): string {
  if (rating <= 1) return 'Again'
  if (rating <= 3) return 'Hard'
  if (rating === 4) return 'Good'
  return 'Easy'
}

export function getRatingEmoji(rating: number): string {
  if (rating <= 1) return '😞'
  if (rating <= 3) return '🤔'
  if (rating === 4) return '🙂'
  return '😎'
}

export function chunkText(text: string, maxChunkSize = 3000): string[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50)

  const chunks: string[] = []
  let currentChunk = ''

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = para
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim())
  }

  // Limit to 8 chunks max to control costs
  return chunks.slice(0, 8)
}
