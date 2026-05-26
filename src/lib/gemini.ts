// ============================================
// Gemini API Client
// ============================================

const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
    finishReason: string
    usageMetadata?: {
      promptTokenCount: number
      candidatesTokenCount: number
      totalTokenCount: number
    }
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
  }
}

export interface GeminiResult {
  text: string
  inputTokens: number
  outputTokens: number
}

export async function callGemini(prompt: string, systemPrompt?: string): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const body = {
    contents: [
      ...(systemPrompt ? [{
        role: 'user',
        parts: [{ text: systemPrompt }]
      }, {
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      }] : []),
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${error}`)
  }

  const data: GeminiResponse = await response.json()
  const candidate = data.candidates[0]

  if (!candidate?.content?.parts?.[0]?.text) {
    throw new Error('No content in Gemini response')
  }

  const text = candidate.content.parts[0].text
  const usage = data.usageMetadata || candidate.usageMetadata

  return {
    text,
    inputTokens: usage?.promptTokenCount || 0,
    outputTokens: usage?.candidatesTokenCount || 0,
  }
}

// Parse JSON from Gemini response (strips markdown code blocks)
export function parseGeminiJSON<T>(text: string): T {
  let cleaned = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  try {
    return JSON.parse(cleaned) as T
  } catch (e) {
    // If initial parse fails, sanitize unescaped newlines inside string values
    try {
      cleaned = cleaned.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
        return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r')
      })
      return JSON.parse(cleaned) as T
    } catch (err) {
      throw new Error(`JSON Parse failed: ${err instanceof Error ? err.message : String(err)}. Raw text: ${text.slice(0, 300)}...`)
    }
  }
}

// Ollama client for lightweight tasks
export async function callOllama(prompt: string, model = 'llama3.2'): Promise<string> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, stream: false }),
  })

  if (!response.ok) throw new Error(`Ollama error: ${response.statusText}`)
  const data = await response.json()
  return data.response
}
