import { BookOpen, Swords, Sparkles } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'

export function WelcomeView() {
  const { setCurrentView } = useGameStore()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary via-bg-secondary/30 to-bg-primary" />
      
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-red/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 text-center">
        <div className="mb-6">
          <div className="relative inline-block">
            <BookOpen className="w-24 h-24 text-gradient-gold animate-float" />
            <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-accent-gold animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-4 font-display">
          <span className="text-gradient-gold">万卷浮生</span>
        </h1>
        
        <p className="text-text-secondary text-lg md:text-xl mb-12 max-w-lg mx-auto">
          穿越古今，邂逅名著。在文字的世界里，书写属于你的传奇。
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => setCurrentView('library')}
            className="group px-8 py-4 bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border-2 border-border-gold rounded-xl font-bold text-lg text-accent-gold hover:from-accent-gold/30 hover:to-border-gold/30 hover:shadow-lg hover:shadow-accent-gold/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6" />
              <span>进入书库</span>
            </div>
          </button>
          
          <button
            onClick={() => setCurrentView('characters')}
            className="group px-8 py-4 bg-gradient-to-r from-accent-red/20 to-red-500/20 border-2 border-accent-red/50 rounded-xl font-bold text-lg text-accent-red hover:from-accent-red/30 hover:to-red-500/30 hover:shadow-lg hover:shadow-accent-red/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Swords className="w-6 h-6" />
              <span>角色图鉴</span>
            </div>
          </button>
        </div>
        
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient-gold mb-1">5</div>
            <div className="text-text-muted text-sm">名著体系</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient-gold mb-1">50+</div>
            <div className="text-text-muted text-sm">传奇角色</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gradient-gold mb-1">∞</div>
            <div className="text-text-muted text-sm">剧情可能</div>
          </div>
        </div>
      </div>
    </div>
  )
}
