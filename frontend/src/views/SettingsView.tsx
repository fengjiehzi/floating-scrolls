import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Database, Download, Eye, EyeOff, KeyRound, MonitorCog, RefreshCcw, Save, Settings, Sparkles, Trash2 } from 'lucide-react'
import { TabNav } from '@/components/TabNav'
import { StatSlider } from '@/components/StatSlider'
import { fetchAIModels, fetchAIProviders, type AIModel, type AIProvider } from '@/services/aiApi'
import { useGameStore } from '@/store/gameStore'

type ThemeChoice = 'ink' | 'paper' | 'auto'
type FontSize = 'small' | 'medium' | 'large'

interface StoredPreferences {
  theme: ThemeChoice
  motionEnabled: boolean
  fontSize: FontSize
  provider: string
  model: string
  temperature: number
  maxTokens: number
  baseUrl?: string
}

const storageKey = 'wanjuan-ui-preferences'
const defaultPreferences: StoredPreferences = {
  theme: 'ink',
  motionEnabled: true,
  fontSize: 'medium',
  provider: 'openai',
  model: 'gpt-5.5',
  temperature: 0.7,
  maxTokens: 2048,
}

export function SettingsView() {
  const { aiConfig, updateAIConfig, addToast } = useGameStore()
  const [activeTab, setActiveTab] = useState('appearance')
  const [theme, setTheme] = useState<ThemeChoice>('ink')
  const [motionEnabled, setMotionEnabled] = useState(true)
  const [fontSize, setFontSize] = useState<FontSize>('medium')
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [providersError, setProvidersError] = useState<string | null>(null)
  const [models, setModels] = useState<AIModel[]>([])
  const [modelsStatus, setModelsStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [showApiKey, setShowApiKey] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const preferences = { ...defaultPreferences, ...JSON.parse(stored) } as StoredPreferences
        setTheme(preferences.theme)
        setMotionEnabled(preferences.motionEnabled)
        setFontSize(preferences.fontSize)
        updateAIConfig({
          provider: preferences.provider,
          model: preferences.model,
          temperature: preferences.temperature,
          maxTokens: preferences.maxTokens,
          baseUrl: preferences.baseUrl,
        })
      }
    } catch {
      localStorage.removeItem(storageKey)
    }

    void fetchAIProviders()
      .then((nextProviders) => {
        setProviders(nextProviders)
        setProvidersError(null)
      })
      .catch((error: unknown) => {
        setProvidersError(error instanceof Error ? error.message : '服务商列表加载失败')
      })

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [updateAIConfig])

  useEffect(() => {
    document.documentElement.dataset.motion = motionEnabled ? 'on' : 'off'
    document.documentElement.dataset.theme = theme
    document.documentElement.dataset.fontSize = fontSize
  }, [fontSize, motionEnabled, theme])

  useEffect(() => {
    if (!aiConfig.provider || aiConfig.provider === 'custom') {
      setModels([])
      setModelsStatus('idle')
      return
    }
    let active = true
    setModelsStatus('loading')
    void fetchAIModels(aiConfig.provider)
      .then((nextModels) => {
        if (!active) return
        setModels(nextModels)
        setModelsStatus('idle')
      })
      .catch(() => {
        if (!active) return
        setModels([])
        setModelsStatus('error')
      })
    return () => { active = false }
  }, [aiConfig.provider])

  const buildPreferences = (): StoredPreferences => ({
    theme,
    motionEnabled,
    fontSize,
    provider: aiConfig.provider,
    model: aiConfig.model,
    temperature: aiConfig.temperature,
    maxTokens: aiConfig.maxTokens,
    ...(aiConfig.baseUrl && { baseUrl: aiConfig.baseUrl }),
  })

  const savePreferences = () => {
    setSaveStatus('saving')
    localStorage.setItem(storageKey, JSON.stringify(buildPreferences()))
    saveTimerRef.current = window.setTimeout(() => {
      setSaveStatus('saved')
      addToast({ type: 'success', message: '非敏感偏好已保存在本机' })
    }, 320)
  }

  const changeProvider = (providerId: string) => {
    const provider = providers.find((item) => item.id === providerId)
    updateAIConfig({
      provider: providerId,
      model: provider?.defaultModel || (providerId === 'custom' ? '' : aiConfig.model),
    })
  }

  const exportPreferences = () => {
    const blob = new Blob([JSON.stringify({ version: 1, preferences: buildPreferences() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = '万卷浮生-界面偏好.json'
    anchor.click()
    URL.revokeObjectURL(url)
    addToast({ type: 'success', message: '偏好数据已导出，未包含 API Key' })
  }

  const restoreDefaults = () => {
    setTheme(defaultPreferences.theme)
    setMotionEnabled(defaultPreferences.motionEnabled)
    setFontSize(defaultPreferences.fontSize)
    updateAIConfig({
      provider: defaultPreferences.provider,
      model: defaultPreferences.model,
      temperature: defaultPreferences.temperature,
      maxTokens: defaultPreferences.maxTokens,
      baseUrl: '',
    })
    addToast({ type: 'info', message: '设置已恢复默认，保存后持久化' })
  }

  const clearPreferences = () => {
    localStorage.removeItem(storageKey)
    restoreDefaults()
    addToast({ type: 'success', message: '本地偏好缓存已清除' })
  }

  const tabs = [
    { id: 'appearance', label: '外观' },
    { id: 'ai', label: 'AI 配置' },
    { id: 'data', label: '本地数据' },
  ]

  return (
    <main className="page-shell">
      <div className="page-container settings-container">
        <header className="page-header">
          <div><span className="section-kicker">本地工作台</span><h1 className="page-title">设置与 AI 配置</h1><p className="page-lead">管理界面偏好和公开模型列表；敏感密钥只停留在当前内存会话。</p></div>
          <button type="button" className="button-primary" onClick={savePreferences} disabled={saveStatus === 'saving'}><Save aria-hidden="true" />{saveStatus === 'saving' ? '保存中…' : saveStatus === 'saved' ? '已保存' : '保存设置'}</button>
        </header>

        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="settings-panel panel">
          {activeTab === 'appearance' && (
            <section className="settings-section" role="tabpanel">
              <div className="settings-section-head"><MonitorCog aria-hidden="true" /><div><h2>外观与动效</h2><p>在墨夜、绢纸与系统偏好之间切换。</p></div></div>
              <div className="theme-list">
                {([['ink', '墨夜', '深色墨夜与鎏金'], ['paper', '绢纸', '浅色阅读工作台'], ['auto', '自动', '跟随系统偏好']] as const).map(([value, label, description]) => (
                  <button key={value} type="button" className={`theme-option${theme === value ? ' is-active' : ''}`} onClick={() => setTheme(value)} aria-pressed={theme === value}>
                    <span className={`theme-swatch theme-swatch-${value}`} aria-hidden="true"><i /></span><span><strong>{label}</strong><small>{description}</small></span>
                  </button>
                ))}
              </div>
              <div className="settings-choice-row"><div><strong>字体大小</strong><span>影响正文、标签和输入控件。</span></div><div className="segmented-control">{(['small', 'medium', 'large'] as const).map((value) => <button key={value} type="button" className={fontSize === value ? 'is-active' : ''} onClick={() => setFontSize(value)}>{value === 'small' ? '小' : value === 'medium' ? '中' : '大'}</button>)}</div></div>
              <button type="button" role="switch" aria-checked={motionEnabled} onClick={() => setMotionEnabled((value) => !value)} className="setting-toggle-row"><span><strong>界面动效</strong><small>关闭后仅保留不超过 120ms 的透明度反馈。</small></span><span className={`toggle${motionEnabled ? ' is-on' : ''}`} aria-hidden="true"><i /></span></button>
            </section>
          )}

          {activeTab === 'ai' && (
            <section className="settings-section" role="tabpanel">
              <div className="settings-section-head"><Settings aria-hidden="true" /><div><h2>生成引擎</h2><p>服务商和模型来自公开接口；配置不会提交到受保护的保存接口。</p></div></div>
              {providersError && <div className="inline-notice is-error"><AlertCircle aria-hidden="true" /><span>{providersError}，仍可手动填写当前配置。</span></div>}
              <div className="settings-field-grid">
                <label className="settings-field"><span>AI 服务商</span><select className="field" value={aiConfig.provider} onChange={(event) => changeProvider(event.target.value)}><option value="openai">OpenAI</option>{providers.filter((provider) => provider.id !== 'openai' && provider.id !== 'custom').map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}<option value="custom">自定义</option></select></label>
                <label className="settings-field"><span>模型</span>{models.length > 0 ? <select className="field" value={models.some((model) => model.id === aiConfig.model) ? aiConfig.model : ''} onChange={(event) => updateAIConfig({ model: event.target.value })}><option value="" disabled>选择模型</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}</option>)}</select> : <input className="field" value={aiConfig.model} onChange={(event) => updateAIConfig({ model: event.target.value })} placeholder={modelsStatus === 'loading' ? '正在获取模型…' : '输入模型名称'} />}</label>
              </div>
              {modelsStatus === 'error' && <div className="inline-notice is-error"><AlertCircle aria-hidden="true" /><span>模型列表加载失败，可暂时手动填写模型名称。</span></div>}
              {aiConfig.provider === 'custom' && <label className="settings-field"><span>API 地址</span><input className="field" value={aiConfig.baseUrl || ''} onChange={(event) => updateAIConfig({ baseUrl: event.target.value })} placeholder="https://example.com/v1" /></label>}
              <label className="settings-field"><span>API Key</span><div className="secret-field"><KeyRound aria-hidden="true" /><input type={showApiKey ? 'text' : 'password'} value={aiConfig.apiKey} onChange={(event) => updateAIConfig({ apiKey: event.target.value })} placeholder="仅保存在当前内存会话" /><button type="button" onClick={() => setShowApiKey((value) => !value)} aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}>{showApiKey ? <EyeOff /> : <Eye />}</button></div></label>
              <div className="settings-slider-grid"><StatSlider label="温度 (Temperature)" value={aiConfig.temperature} min={0} max={2} onChange={(value) => updateAIConfig({ temperature: value })} /><StatSlider label="最大 Token" value={aiConfig.maxTokens} min={256} max={8192} onChange={(value) => updateAIConfig({ maxTokens: value })} /></div>
              <div className="protected-action"><Sparkles aria-hidden="true" /><div><strong>当前为本地配置</strong><span>登录、测试连接和云端保存不在本次 UI 范围内。</span></div></div>
            </section>
          )}

          {activeTab === 'data' && (
            <section className="settings-section" role="tabpanel">
              <div className="settings-section-head"><Database aria-hidden="true" /><div><h2>本地数据</h2><p>导出内容不包含 API Key，也不会读取旧应用数据库。</p></div></div>
              <div className="data-actions">
                <button type="button" onClick={exportPreferences}><Download aria-hidden="true" /><span><strong>导出偏好</strong><small>下载 JSON 配置</small></span></button>
                <button type="button" onClick={restoreDefaults}><RefreshCcw aria-hidden="true" /><span><strong>恢复默认</strong><small>暂不写入本地缓存</small></span></button>
                <button type="button" className="is-danger" onClick={clearPreferences}><Trash2 aria-hidden="true" /><span><strong>清除缓存</strong><small>移除已保存的非敏感偏好</small></span></button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}
