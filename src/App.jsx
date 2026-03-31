import { Suspense, useState, useCallback, useEffect } from 'react'
import Scene from './components/Scene.jsx'
import HUD from './components/HUD.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { useSolarSystem } from './hooks/useSolarSystem.js'

// Simulate load progress tied to asset fetching
function useLoadProgress() {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let val = 0
    const id = setInterval(() => {
      val += val < 80 ? 8 : val < 95 ? 2 : 0.5
      const capped = Math.min(val, 100)
      setProgress(capped)
      if (capped >= 100) {
        clearInterval(id)
        setTimeout(() => setReady(true), 400)
      }
    }, 60)
    return () => clearInterval(id)
  }, [])

  // kept for API compat, unused now
  const markReady = useCallback(() => {}, [])

  return { progress, ready, markReady }
}

export default function App() {
  const {
    selectedPlanet,
    showOrbits,
    showLabels,
    isPaused,
    speedMultiplier,
    selectPlanet,
    deselectPlanet,
    setShowOrbits,
    setShowLabels,
    setIsPaused,
    setSpeedMultiplier,
  } = useSolarSystem()

  const { progress, ready, markReady } = useLoadProgress()

  // Space key unlocks camera follow
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault()
        deselectPlanet()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deselectPlanet])

  // Compute scaled AU distance from selected planet's orbit radius
  // Earth = 17 units = 1.0 AU
  const AU_SCALE = 1 / 17
  const sunDistance = selectedPlanet
    ? selectedPlanet.orbitRadius * AU_SCALE
    : null

  return (
    <ErrorBoundary>
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000005' }}>
      {/* Loading overlay */}
      {!ready && <LoadingScreen progress={progress} />}

      {/* 3-D Canvas */}
      <Suspense fallback={null}>
        <div style={{ width: '100%', height: '100%' }}>
          <Scene
            onSelectPlanet={selectPlanet}
            showOrbits={showOrbits}
            showLabels={showLabels}
            isPaused={isPaused}
            speedMultiplier={speedMultiplier}
            focusedPlanetId={selectedPlanet?.id ?? null}
          />
        </div>
      </Suspense>

      {/* HUD overlay — always on top */}
      {ready && (
        <HUD
          selectedPlanet={selectedPlanet}
          showOrbits={showOrbits}
          showLabels={showLabels}
          isPaused={isPaused}
          speedMultiplier={speedMultiplier}
          sunDistance={sunDistance}
          onToggleOrbits={() => setShowOrbits((v) => !v)}
          onToggleLabels={() => setShowLabels((v) => !v)}
          onTogglePause={() => setIsPaused((v) => !v)}
          onSpeedChange={setSpeedMultiplier}
          onDeselect={deselectPlanet}
        />
      )}

    </div>
    </ErrorBoundary>
  )
}
