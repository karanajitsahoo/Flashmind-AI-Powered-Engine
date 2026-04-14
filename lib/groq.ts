import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

export interface GeneratedCard {
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
  nextReview: number
  interval: number
  easeFactor: number
  repetitions: number
}

export async function generateFlashcardsFromChunk(
  chunk: string,
  chunkIndex: number,
  totalChunks: number
): Promise<GeneratedCard[]> {
  const prompt = `You are an expert educator and assessment designer.

Analyze this study material (chunk ${chunkIndex + 1} of ${totalChunks}) and generate 5-10 high-quality questions as a mixed set of flashcards and MCQs.

MATERIAL:
${chunk.slice(0, 8000)}

RULES:
- Mix of "flashcard" and "mcq" types (roughly 50/50)
- For MCQs: 4 options, 1 correct, 3 plausible distractors
- Questions must be deep, non-trivial, test real understanding
- Cover key concepts, definitions, cause-effect, relationships
- Each card needs a "concept" tag (specific topic name, e.g. "Photosynthesis", "Newton's Laws")
- explanation: why correct answer is right and others are wrong
- difficulty: easy | medium | hard
- tags: array of 2-3 related keywords

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "type": "flashcard",
    "question": "...",
    "answer": "...",
    "options": [],
    "correctAnswer": "",
    "explanation": "...",
    "difficulty": "easy|medium|hard",
    "concept": "Specific Concept Name",
    "topic": "...",
    "tags": ["tag1", "tag2"],
    "nextReview": 1,
    "interval": 1,
    "easeFactor": 2.5,
    "repetitions": 0
  },
  {
    "type": "mcq",
    "question": "...",
    "answer": "exact correct option text",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": "exact correct option text",
    "explanation": "...",
    "difficulty": "easy|medium|hard",
    "concept": "Specific Concept Name",
    "topic": "...",
    "tags": ["tag1", "tag2"],
    "nextReview": 1,
    "interval": 1,
    "easeFactor": 2.5,
    "repetitions": 0
  }
]`

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are an expert educator. Return ONLY valid JSON arrays. No markdown, no explanation, no text outside JSON.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.8,
    top_p: 0.9,
    max_tokens: 3000,
  })

  const output = completion.choices[0]?.message?.content?.trim() || '[]'

  try {
    const clean = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    const parsed = JSON.parse(match ? match[0] : clean)
    return Array.isArray(parsed) ? parsed.filter(validateCard) : []
  } catch {
    console.error('Failed to parse Groq response:', output)
    return []
  }
}

function validateCard(card: unknown): card is GeneratedCard {
  if (typeof card !== 'object' || card === null) return false
  const c = card as Record<string, unknown>
  return (
    typeof c.question === 'string' &&
    typeof c.answer === 'string' &&
    c.question.length > 5 &&
    c.answer.length > 5 &&
    (c.type === 'flashcard' || c.type === 'mcq')
  )
}

export async function generateDeckTitle(text: string): Promise<string> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'Generate a short descriptive title (max 5 words) for the given content. Return ONLY the title, nothing else.',
      },
      { role: 'user', content: text.slice(0, 500) },
    ],
    max_tokens: 20,
    temperature: 0.3,
  })
  return completion.choices[0]?.message?.content?.trim() || 'Untitled Deck'
}

export { groq }

// ─── Learning Cards ────────────────────────────────────────────────────────

export interface LearningCard {
  title: string
  content: string
  example: string
  difficulty: 'easy' | 'medium' | 'hard'
  concept: string
}

export async function generateLearningCards(text: string): Promise<LearningCard[]> {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are an expert educator. Return ONLY valid JSON arrays. No markdown, no explanation, no text outside JSON.',
      },
      {
        role: 'user',
        content: `You are a brilliant teacher explaining concepts to a student.

From the study material below, create 8-15 learning cards that TEACH key concepts BEFORE testing.

Each card must:
- Explain ONE concept clearly and simply
- Use friendly, teacher-like language (not textbook boring)
- Include a real-world example or analogy where possible
- Be complete enough that a student can understand WITHOUT reading the original text

MATERIAL:
${text.slice(0, 10000)}

Return ONLY a valid JSON array:
[
  {
    "title": "Short concept name",
    "content": "Clear explanation in 2-4 sentences. Simple language, teacher tone.",
    "example": "A relatable real-world example or analogy",
    "difficulty": "easy|medium|hard",
    "concept": "Concept Name"
  }
]`,
      },
    ],
    temperature: 0.4,
    max_tokens: 4000,
  })

  const output = completion.choices[0]?.message?.content?.trim() || '[]'

  try {
    const clean = output.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const match = clean.match(/\[[\s\S]*\]/)
    const parsed = JSON.parse(match ? match[0] : clean)
    return Array.isArray(parsed) ? parsed.filter((c: unknown) => {
      if (typeof c !== 'object' || c === null) return false
      const card = c as Record<string, unknown>
      return typeof card.title === 'string' && typeof card.content === 'string' && card.content.length > 10
    }) : []
  } catch {
    console.error('Failed to parse learning cards:', output)
    return []
  }
}
