import mongoose, { Schema, Document } from 'mongoose'

export interface IReviewLog extends Document {
  flashcardId: string
  deckId: string
  rating: number
  wasCorrect: boolean
  reviewedAt: Date
}

const ReviewLogSchema = new Schema<IReviewLog>({
  flashcardId: { type: String, required: true },
  deckId: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  wasCorrect: { type: Boolean, required: true },
  reviewedAt: { type: Date, default: () => new Date() },
})

ReviewLogSchema.index({ deckId: 1, reviewedAt: -1 })
ReviewLogSchema.index({ reviewedAt: -1 })

export const ReviewLog =
  mongoose.models.ReviewLog ?? mongoose.model<IReviewLog>('ReviewLog', ReviewLogSchema)
