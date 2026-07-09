export interface StoryChoice {
  id: string
  text: string
  nextNodeId: string
}

export interface StoryNode {
  id: string
  text: string
  character: string
  choices?: StoryChoice[]
  isEnding: boolean
}

export interface StorySession {
  id: string
  title: string
  currentNodeId: string
  nodes: StoryNode[]
  history: string[]
  createdAt: string
  isCompleted: boolean
}
