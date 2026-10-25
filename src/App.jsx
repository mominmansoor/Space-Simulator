import { Suspense, useState, useEffect } from 'react'
import Scene from './components/Scene.jsx'
import HUD from './components/HUD.jsx'
import LoadingScreen from './components/LoadingScreen.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { useSolarSystem } from './hooks/useSolarSystem.js'
import { preloadTextures } from './utils/proceduralTextures.js'

// Real load progress: planet textures are painted in background workers and
// the scene only mounts once they are all ready.
function useLoadProgress() {
  const [progress, setProgress] = useState(0)
  const [texturesReady, setTexturesReady] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    const started = performance.now()
    preloadTextures((p) => { if (alive) setProgress(Math.round(p * 100)) }).then(() => {
      if (!alive) return
      // mount the scene behind the boot screen so shaders compile out of sight
      setTexturesReady(true)
      // keep the boot screen up for a beat so it doesn't just flash
      const wait = Math.max(0, 1200 - (performance.now() - started))
      setTimeout(() => { if (alive) setReady(true) }, wait + 600)
    })
    return () => { alive = false }
  }, [])

  return { progress, texturesReady, ready }
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

  const { progress, texturesReady, ready } = useLoadProgress()

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
      {texturesReady && <Suspense fallback={null}>
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
      </Suspense>}

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
