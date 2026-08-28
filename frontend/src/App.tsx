import { useEffect } from 'react'
import { BrowserRouter, Navigate, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { WelcomeView } from '@/views/WelcomeView'
import { LibraryView } from '@/views/LibraryView'
import { CharacterView } from '@/views/CharacterView'
import { CharacterDetailView } from '@/views/CharacterDetailView'
import { ItemsView } from '@/views/ItemsView'
import { BattleView } from '@/views/BattleView'
import { BattleResultView } from '@/views/BattleResultView'
import { StoryView } from '@/views/StoryView'
import { SettingsView } from '@/views/SettingsView'
import { ToastContainer } from '@/components/Toast'
import { Navigation } from '@/components/Navigation'
import { useGameStore } from '@/store/gameStore'

function Layout() {
  const location = useLocation()
  const isWelcome = location.pathname === '/'
  const isImmersive = location.pathname.startsWith('/battle')
  const loadCharacters = useGameStore((state) => state.loadCharacters)

  useEffect(() => {
    void loadCharacters()
  }, [loadCharacters])

  return (
    <div className={`app-shell${isImmersive ? ' app-shell--immersive' : ''}`}>
      {!isWelcome && !isImmersive && <Navigation />}
      <div className={`app-main${isWelcome ? ' app-main--welcome' : ''}${isImmersive ? ' app-main--immersive' : ''}`}>
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  )
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<WelcomeView />} />
          <Route path="library" element={<LibraryView />} />
          <Route path="characters" element={<CharacterView />} />
          <Route path="characters/:id" element={<CharacterDetailView />} />
          <Route path="items" element={<ItemsView />} />
          <Route path="battle" element={<BattleView />} />
          <Route path="battle/result" element={<BattleResultView />} />
          <Route path="story" element={<StoryView />} />
          <Route path="settings" element={<SettingsView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppContent
