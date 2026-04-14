import mongoose, { Schema, Document } from 'mongoose'

export interface IDeck extends Document {
  userId: string
  title: string
  description?: string
  tags: string[]
  totalCards: number
  createdAt: Date
  updatedAt: Date
  lastReviewedAt?: Date
}

const DeckSchema = new Schema<IDeck>(
  {
    userId: { type: String, required: true, default: 'default' },
    title: { type: String, required: true },
    description: { type: String },
    tags: [{ type: String }],
    totalCards: { type: Number, default: 0 },
    lastReviewedAt: { type: Date },
  },
  { timestamps: true }
)

export const Deck = mongoose.models.Deck ?? mongoose.model<IDeck>('Deck', DeckSchema)
