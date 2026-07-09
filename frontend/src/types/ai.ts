export interface AIConfig {
  apiKey: string
  provider: 'openai' | 'anthropic' | 'google' | 'custom'
  model: string
  temperature: number
  maxTokens: number
  baseUrl?: string
}
