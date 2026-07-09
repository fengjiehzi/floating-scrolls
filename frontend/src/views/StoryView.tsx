import { useState } from 'react'
import { BookOpen, Play, RotateCcw, Sparkles } from 'lucide-react'
import { Loading } from '@/components/Loading'
import { useGameStore } from '@/store/gameStore'
import type { StoryNode, StoryChoice } from '@/types'

export function StoryView() {
  const { characters, setCurrentView } = useGameStore()
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null)
  const [storyHistory, setStoryHistory] = useState<string[]>([])

  const generateStory = async () => {
    setIsGenerating(true)
    
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const sampleNode: StoryNode = {
      id: '1',
      text: '夜幕降临，你走进了一座古老的藏书阁。书架上的古籍散发出淡淡的光芒，仿佛在诉说着千年的故事。突然，一本名为《万卷浮生》的古书从书架上掉落下来，书页自动翻开，露出了一行字："有缘人，你终于来了..."',
      character: '神秘声音',
      isEnding: false,
      choices: [
        { id: '1', text: '拿起古书，仔细阅读', nextNodeId: '2' },
        { id: '2', text: '环顾四周，寻找声音的来源', nextNodeId: '3' },
        { id: '3', text: '转身离开，假装什么都没发生', nextNodeId: '4' },
      ],
    }

    setCurrentNode(sampleNode)
    setStoryHistory([sampleNode.text])
    setIsGenerating(false)
  }

  const handleChoice = async (choice: StoryChoice) => {
    if (!currentNode) return

    setIsGenerating(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const nextNodes: Record<string, StoryNode> = {
      '2': {
        id: '2',
        text: '当你的手指触碰到书页的那一刻，一道金光闪过，你发现自己穿越到了书中的世界。眼前是一座宏伟的古代城池，城门上写着"长安"二字。街上人来人往，热闹非凡。',
        character: '旁白',
        isEnding: false,
        choices: [
          { id: '4', text: '走进城池，探索这个世界', nextNodeId: '5' },
          { id: '5', text: '寻找回去的方法', nextNodeId: '6' },
        ],
      },
      '3': {
        id: '3',
        text: '你仔细观察四周，发现书架后面有一道微弱的光芒。走近一看，原来是一位白发苍苍的老者，他手中拿着一盏古老的油灯。"年轻人，你能看到我，说明你是被选中的人。"老者缓缓说道。',
        character: '神秘老者',
        isEnding: false,
        choices: [
          { id: '6', text: '询问老者关于这座藏书阁的秘密', nextNodeId: '5' },
          { id: '7', text: '请求老者送你回去', nextNodeId: '6' },
        ],
      },
      '4': {
        id: '4',
        text: '你转身准备离开，但无论怎么走，都无法找到出口。身后传来一阵轻笑："既然来了，就别急着走嘛..." 你回头一看，发现整个藏书阁已经变了模样，书架变成了参天大树，书本变成了飞舞的蝴蝶。',
        character: '神秘声音',
        isEnding: false,
        choices: [
          { id: '8', text: '接受现实，开始探索', nextNodeId: '5' },
          { id: '9', text: '大声呼救', nextNodeId: '6' },
        ],
      },
      '5': {
        id: '5',
        text: '你决定勇敢地探索这个神秘的世界。在你的旅途中，你遇到了许多传奇人物——孙悟空的金箍棒在月光下闪烁，诸葛亮的羽扇轻摇，林黛玉的眼泪化作珍珠。你逐渐发现，这些角色似乎都在等待着你的到来。',
        character: '旁白',
        isEnding: false,
        choices: [
          { id: '10', text: '继续探索，揭开更多秘密', nextNodeId: '7' },
          { id: '11', text: '选择一位角色，开始冒险', nextNodeId: '7' },
        ],
      },
      '6': {
        id: '6',
        text: '"回去？"老者微微一笑，"你来的时候，你的世界就已经改变了。看看你的手掌，那里已经有了书卷的印记。你已经成为了万卷浮生的一部分..."',
        character: '神秘老者',
        isEnding: true,
      },
      '7': {
        id: '7',
        text: '恭喜你！你已经完成了这段奇幻之旅的第一章。在万卷浮生的世界里，每一个选择都将开启新的故事。未来的冒险正等待着你...',
        character: '旁白',
        isEnding: true,
      },
    }

    const nextNode = nextNodes[choice.nextNodeId]
    if (nextNode) {
      setCurrentNode(nextNode)
      setStoryHistory([...storyHistory, choice.text, nextNode.text])
    }

    setIsGenerating(false)
  }

  const resetStory = () => {
    setCurrentNode(null)
    setStoryHistory([])
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gradient-gold mb-2">剧情生成</h1>
            <p className="text-text-secondary">开启属于你的传奇故事</p>
          </div>
          <button
            onClick={() => setCurrentView('welcome')}
            className="flex items-center gap-2 px-4 py-2 bg-bg-secondary border border-text-muted/30 rounded-lg text-text-secondary hover:text-text-primary transition-colors"
          >
            <BookOpen className="w-5 h-5" />
            <span>返回主页</span>
          </button>
        </div>

        {!currentNode ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-8">
              <BookOpen className="w-24 h-24 text-gradient-gold animate-float" />
              <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-accent-gold animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-4">选择你的故事起点</h2>
            <p className="text-text-secondary mb-8 text-center max-w-md">
              从你收集的角色中选择，AI将为你生成独特的剧情故事
            </p>
            <button
              onClick={generateStory}
              disabled={characters.length === 0}
              className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border-2 border-border-gold rounded-xl font-bold text-lg text-accent-gold disabled:opacity-50 disabled:cursor-not-allowed hover:from-accent-gold/30 hover:to-border-gold/30 hover:shadow-lg hover:shadow-accent-gold/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <Play className="w-6 h-6" />
              <span>开始故事</span>
            </button>
            {characters.length === 0 && (
              <p className="mt-4 text-text-muted text-sm">请先从书库提取角色</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-card border border-border-gold/30 rounded-xl p-6 card-shadow">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-text-muted">{currentNode.character}</span>
                <button
                  onClick={resetStory}
                  className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重新开始</span>
                </button>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg text-text-primary leading-relaxed whitespace-pre-line">
                  {currentNode.text}
                </p>
              </div>
            </div>

            {isGenerating && (
              <div className="flex justify-center py-8">
                <Loading message="正在生成剧情..." />
              </div>
            )}

            {!isGenerating && !currentNode.isEnding && currentNode.choices && (
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-text-primary">你的选择</h3>
                {currentNode.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoice(choice)}
                    className="w-full p-4 bg-bg-secondary border border-text-muted/30 rounded-xl text-left hover:border-border-gold/50 hover:bg-bg-card transition-all duration-200 group"
                  >
                    <span className="text-text-primary group-hover:text-gradient-gold transition-colors">
                      {choice.text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {!isGenerating && currentNode.isEnding && (
              <div className="flex justify-center">
                <button
                  onClick={resetStory}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-gold/20 to-border-gold/20 border border-border-gold rounded-lg text-accent-gold hover:from-accent-gold/30 hover:to-border-gold/30 transition-all"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>重新开始</span>
                </button>
              </div>
            )}

            <div className="bg-bg-secondary rounded-xl p-4">
              <h3 className="text-sm font-bold text-text-muted mb-2">故事记录</h3>
              <div className="h-32 overflow-y-auto space-y-2">
                {storyHistory.map((text, index) => (
                  <div key={index} className="text-sm text-text-secondary">
                    {index % 2 === 0 ? (
                      <span className="text-text-primary">{text}</span>
                    ) : (
                      <span className="text-accent-gold">→ {text}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
