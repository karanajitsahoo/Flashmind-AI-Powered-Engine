import mongoose, { Schema, Document } from 'mongoose'

export interface IFlashcard extends Document {
  deckId: string
  type: 'flashcard' | 'mcq'
  question: string
  answer: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
  topic: string
  tags: string[]
  easeFactor: number
  interval: number
  repetitions: number
  nextReviewDate: Date
  createdAt: Date
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    deckId: { type: String, required: true, index: true },
    type: { type: String, enum: ['flashcard', 'mcq'], default: 'flashcard' },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    concept: { type: String, default: 'General' },
    topic: { type: String, default: 'General' },
    tags: [{ type: String }],
    easeFactor: { type: Number, default: 2.5 },
    interval: { type: Number, default: 0 },
    repetitions: { type: Number, default: 0 },
    nextReviewDate: { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)

FlashcardSchema.index({ deckId: 1, nextReviewDate: 1 })

export const Flashcard =
  mongoose.models.Flashcard ?? mongoose.model<IFlashcard>('Flashcard', FlashcardSchema)
