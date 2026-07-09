import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { WelcomeView } from '@/views/WelcomeView'
import { LibraryView } from '@/views/LibraryView'
import { CharacterView } from '@/views/CharacterView'
import { BattleView } from '@/views/BattleView'
import { StoryView } from '@/views/StoryView'
import { SettingsView } from '@/views/SettingsView'
import { ToastContainer } from '@/components/Toast'
import { Navigation } from '@/components/Navigation'
import { useGameStore } from '@/store/gameStore'

function Layout() {
  const { currentView } = useGameStore()

  return (
    <div className="min-h-screen bg-bg-primary">
      {currentView !== 'welcome' && <Navigation />}
      <main className={`transition-all duration-300 ${currentView !== 'welcome' ? 'pt-16 md:pt-20' : ''}`}>
        <Outlet />
      </main>
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
          <Route path="battle" element={<BattleView />} />
          <Route path="story" element={<StoryView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppContent