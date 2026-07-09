import { useState } from 'react'
import { Settings, Save, BookOpen, Shield, Bell } from 'lucide-react'
import { TabNav } from '@/components/TabNav'
import { StatSlider } from '@/components/StatSlider'
import { useGameStore } from '@/store/gameStore'

export function SettingsView() {
  const { aiConfig, updateAIConfig, setCurrentView } = useGameStore()
  const [activeTab, setActiveTab] = useState('ai')

  const tabs = [
    { id: 'ai', label: 'AI配置' },
    { id: 'appearance', label: '外观' },
    { id: 'notification', label: '通知' },
  ]

  const handleSave = () => {
    updateAIConfig(aiConfig)
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold mb-2">设置</h1>
            <p className="text-text-secondary">配置你的游戏体验</p>
          </div>
          <button
            onClick={() => setCurrentView('welcome')}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span>返回主页</span>
          </button>
        </div>

        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className="mt-6 bg-bg-secondary rounded-xl p-6">
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="w-6 h-6 text-accent-gold" />
                <h2 className="text-xl font-bold text-text-primary">AI配置</h2>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">API Key</label>
                <input
                  type="password"
                  value={aiConfig.apiKey}
                  onChange={(e) => updateAIConfig({ apiKey: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-card border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-border-gold/50"
                  placeholder="请输入你的 API Key"
                />
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">AI供应商</label>
                <select
                  value={aiConfig.provider}
                  onChange={(e) => updateAIConfig({ provider: e.target.value as typeof aiConfig.provider })}
                  className="w-full px-4 py-3 bg-bg-card border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-border-gold/50"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">模型</label>
                <input
                  type="text"
                  value={aiConfig.model}
                  onChange={(e) => updateAIConfig({ model: e.target.value })}
                  className="w-full px-4 py-3 bg-bg-card border border-text-muted/30 rounded-lg text-text-primary focus:outline-none focus:border-border-gold/50"
                  placeholder="如: gpt-4o"
                />
              </div>

              <StatSlider
                label="温度 (Temperature)"
                value={aiConfig.temperature}
                min={0}
                max={2}
                onChange={(value) => updateAIConfig({ temperature: value })}
                unit=""
              />

              <StatSlider
                label="最大 Token"
                value={aiConfig.maxTokens}
                min={256}
                max={8192}
                onChange={(value) => updateAIConfig({ maxTokens: value })}
                unit=""
              />

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border border-border-gold rounded-lg text-accent-gold hover:from-accent-gold/30 hover:to-border-gold/30 transition-all"
                >
                  <Save className="w-5 h-5" />
                  <span>保存配置</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-6 h-6 text-accent-gold" />
                <h2 className="text-xl font-bold text-text-primary">外观设置</h2>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">主题</label>
                <div className="grid grid-cols-3 gap-4">
                  <button className="p-4 bg-bg-card border-2 border-border-gold rounded-lg">
                    <div className="w-full h-8 rounded mb-2 bg-gradient-to-r from-bg-primary to-bg-secondary" />
                    <span className="text-sm text-text-primary">暗黑模式</span>
                  </button>
                  <button className="p-4 bg-bg-card border border-text-muted/30 rounded-lg">
                    <div className="w-full h-8 rounded mb-2 bg-gradient-to-r from-gray-100 to-gray-200" />
                    <span className="text-sm text-text-muted">浅色模式</span>
                  </button>
                  <button className="p-4 bg-bg-card border border-text-muted/30 rounded-lg">
                    <div className="w-full h-8 rounded mb-2 bg-gradient-to-r from-blue-900 to-purple-900" />
                    <span className="text-sm text-text-muted">蓝色主题</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-text-secondary mb-2">动画效果</label>
                <div className="flex items-center justify-between">
                  <span className="text-text-primary">启用动画</span>
                  <button className="relative w-12 h-6 bg-accent-gold/30 rounded-full">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-accent-gold rounded-full" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notification' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-6 h-6 text-accent-gold" />
                <h2 className="text-xl font-bold text-text-primary">通知设置</h2>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-text-primary">战斗通知</div>
                  <div className="text-sm text-text-muted">接收战斗相关的消息通知</div>
                </div>
                <button className="relative w-12 h-6 bg-accent-gold/30 rounded-full">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-accent-gold rounded-full" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-text-primary">剧情更新</div>
                  <div className="text-sm text-text-muted">接收剧情生成完成的通知</div>
                </div>
                <button className="relative w-12 h-6 bg-accent-gold/30 rounded-full">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-accent-gold rounded-full" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-text-primary">系统消息</div>
                  <div className="text-sm text-text-muted">接收系统更新和维护通知</div>
                </div>
                <button className="relative w-12 h-6 bg-text-muted/30 rounded-full">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-text-muted rounded-full" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
