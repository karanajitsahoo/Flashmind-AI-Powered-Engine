import mongoose, { Schema, Document } from 'mongoose'

export interface ILearningCard extends Document {
  deckId: string
  title: string
  content: string
  example: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
  order: number
}

const LearningCardSchema = new Schema<ILearningCard>(
  {
    deckId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    example: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    concept: { type: String, default: 'General' },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const LearningCard =
  mongoose.models.LearningCard ?? mongoose.model<ILearningCard>('LearningCard', LearningCardSchema)
