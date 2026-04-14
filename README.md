
# 🧠 AI Flashcard Engine

Turn any PDF into an **intelligent learning system** with AI-powered MCQs, concept tracking, and spaced repetition for long-term retention.

**Tech stack:** Next.js 14 · Tailwind CSS · MongoDB · Groq (LLM) · Vercel

---

## ✨ Features

- **PDF → Smart Learning System** — Upload any text-based PDF and generate structured learning content
- **High-Quality MCQs** — Context-aware questions with similar (but tricky) options
- **Learning Mode** — Concepts, definitions, relationships, and examples before practice
- **Practice Mode (MCQ Only)** — Clean, focused MCQ solving with instant feedback
- **SM-2 Spaced Repetition** — Anki-style algorithm that adapts based on your performance
- **Concept Tracking** — Weak / Shaky / Strong classification with accuracy %
- **Resume System** — Continue exactly where you left off
- **Refresh / Renew** — Generate new questions from the same PDF
- **Dashboard** — Decks, progress, and analytics
- **Mobile responsive** — Study anywhere

---

## 🚀 Quick Start (Local)

### 1. Clone and install

```bash
git git clone https://github.com/karanajitsahoo/flashcard-engine-Cuemath-.git
cd flashcard-engine
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/flashcard-engine
GROQ_API_KEY=your_api_key
```

**MongoDB:** https://www.mongodb.com/atlas

### 3. Run the development server

```bash
npm run dev
```

Open http://localhost:3000

---

## 🌐 Deploy to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel
```

Then add environment variables:

```bash
vercel env add MONGODB_URI
vercel env add GROQ_API_KEY
vercel --prod
```

### Option B: Vercel Dashboard

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Add environment variables:
   - `MONGODB_URI`
   - `GROQ_API_KEY`
5. Click **Deploy**

---

## 📁 Project Structure

```
flashcard-engine/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── upload/
│   │   └── page.tsx                  # PDF upload page
│   ├── dashboard/
│   │   └── page.tsx                  # Dashboard (stats + decks)
│   ├── learn/
│   │   └── [deckId]/
│   │       └── page.tsx              # Learning mode
│   ├── review/
│   │   └── [deckId]/
│   │       └── page.tsx              # Practice (MCQ) mode
│   └── api/
│       ├── upload/
│       │   └── route.ts              # PDF parsing
│       ├── generate/
│       │   └── route.ts              # AI generation / refresh
│       ├── decks/
│       │   └── route.ts              # Deck CRUD + stats
│       ├── review/
│       │   └── route.ts              # SM-2 + practice cards
│       ├── learn/
│       │   └── route.ts              # Learning cards
│       └── stats/
│           └── route.ts              # Analytics
├── components/
│   ├── DeckCard.tsx
│   ├── Flashcard.tsx
│   ├── Navbar.tsx
│   ├── ProgressBar.tsx
│   ├── ReviewButtons.tsx
│   └── UploadBox.tsx
├── lib/
│   ├── groq.ts
│   ├── mongodb.ts
│   └── spacedRepetition.ts
├── models/
│   ├── Deck.ts
│   ├── Flashcard.ts
│   ├── LearningCard.ts
│   └── ReviewLog.ts
├── public/
├── styles/
│   └── globals.css
├── next.config.js
├── package.json
└── README.md
```

---

## 🔁 SM-2 Algorithm

Each card stores:

| Field | Default | Description |
|-------|---------|-------------|
| `easeFactor` | 2.5 | Multiplier for interval growth |
| `interval` | 0 | Days until next review |
| `repetitions` | 0 | Correct-answer streak |
| `nextReviewDate` | now | When card is due |

Ratings:
- Again — reset
- Hard — slow growth
- Good — normal growth
- Easy — faster growth

---

## 📊 Concept Tracking

Each concept tracks:
- Total questions
- Correct answers
- Accuracy %

Categories:
- Weak
- Shaky
- Strong

---

## 🧪 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload PDF |
| `/api/generate` | POST | Generate / refresh cards |
| `/api/decks` | GET | Fetch decks |
| `/api/review` | GET | Practice cards |
| `/api/review` | POST | Submit answer |
| `/api/stats` | GET | Analytics |

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection |
| `GROQ_API_KEY` | ✅ | LLM API key |

---

## 👨‍💻 Author

**Karanajit Sahoo**

Built with ♥ using Next.js, OpenAI, and MongoDB Atlas.

---

⭐ If you like this project, give it a star and feel free to connect on LinkedIN!