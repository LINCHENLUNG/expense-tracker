import { ALL_CATEGORIES } from './categories'

const CATEGORIES = ALL_CATEGORIES.map((c) => c.key)

const SYSTEM_PROMPT = `You are an expense-entry parser. Given a short user description of a
purchase, return structured JSON only — no extra text, no explanation, no markdown fences.
The JSON must have exactly these fields:
  amount: number
  category: one of ${JSON.stringify(CATEGORIES)}
  date: string in YYYY-MM-DD format (assume today if not stated)
Example output: {"amount": 120, "category": "Food", "date": "2026-08-22"}`

// Parses free-form text ("$12 coffee this morning") into a structured
// transaction draft via the Gemini API. The caller MUST show the result to
// the user for confirmation before writing it to Firebase — never persist
// this output directly (see TransactionsContext.addTransaction).
export async function parseTransactionWithGemini(text) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set — add it to your .env file')
  }

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              amount: { type: 'NUMBER' },
              category: { type: 'STRING', enum: CATEGORIES },
              date: { type: 'STRING' },
            },
            required: ['amount', 'category', 'date'],
          },
        },
      }),
    },
  )

  if (!res.ok) {
    throw new Error(`Gemini request failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!raw) throw new Error('Gemini returned no structured output')

  return JSON.parse(raw)
}
