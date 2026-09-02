import { apiUrl } from '@/services/apiUrl'

export interface AIProvider {
  id: string
  name: string
  defaultModel?: string
  modelCount?: number
}

export interface AIModel {
  id: string
  name: string
  type?: string
  description?: string
}

export async function fetchAIProviders(): Promise<AIProvider[]> {
  const response = await fetch(apiUrl('/api/ai/providers'), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`AI 服务商请求失败（${response.status}）`)
  const data = await response.json() as { providers?: Array<AIProvider & { default_model?: string; model_count?: number }> }
  if (!Array.isArray(data.providers)) throw new Error('AI 服务商返回格式不正确')
  return data.providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    defaultModel: provider.default_model || provider.defaultModel,
    modelCount: provider.model_count ?? provider.modelCount,
  }))
}

export async function fetchAIModels(providerId: string): Promise<AIModel[]> {
  const response = await fetch(apiUrl(`/api/ai/providers/${encodeURIComponent(providerId)}/models`), {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`模型列表请求失败（${response.status}）`)
  const data = await response.json() as { models?: Array<string | AIModel> }
  return Array.isArray(data.models) ? data.models.map((model) => (
    typeof model === 'string' ? { id: model, name: model } : model
  )) : []
}
