export interface AIConfig {
  apiKey: string
  provider: string
  model: string
  temperature: number
  maxTokens: number
  baseUrl?: string
}
