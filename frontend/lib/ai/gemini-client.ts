import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not set in environment variables')
}

const genAI = new GoogleGenerativeAI(API_KEY)

const DEFAULT_MODEL = 'gemini-1.5-flash'

interface GenerationConfig {
  temperature?: number
  maxOutputTokens?: number
  topP?: number
  topK?: number
}

interface AIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export class GeminiClient {
  private model: GenerativeModel
  private config: GenerationConfig

  constructor(model: string = DEFAULT_MODEL, config: GenerationConfig = {}) {
    this.model = genAI.getGenerativeModel({ model })
    this.config = {
      temperature: 0.4,
      maxOutputTokens: 1024,
      topP: 0.8,
      topK: 40,
      ...config
    }
  }

  async generateText(prompt: string): Promise<AIResponse<string>> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: this.config
      })

      const text = result.response.text()
      return { success: true, data: text }
    } catch (error) {
      console.error('Gemini API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateJSON<T>(prompt: string, schema?: any): Promise<AIResponse<T>> {
    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          ...this.config,
          responseMimeType: 'application/json',
          ...(schema && { responseSchema: schema })
        }
      })

      const text = result.response.text()
      const data = JSON.parse(text) as T
      return { success: true, data }
    } catch (error) {
      console.error('Gemini JSON API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async generateWithStreaming(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<AIResponse<string>> {
    try {
      const result = await this.model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: this.config
      })

      let fullText = ''
      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        fullText += chunkText
        onChunk(chunkText)
      }

      return { success: true, data: fullText }
    } catch (error) {
      console.error('Gemini Streaming API Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

export const createGeminiClient = (
  model?: string,
  config?: GenerationConfig
): GeminiClient => new GeminiClient(model, config)

export default GeminiClient
