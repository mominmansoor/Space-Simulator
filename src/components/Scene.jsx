import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import Sun from './Sun.jsx'
import Planet from './Planet.jsx'
import Starfield from './Starfield.jsx'
import AsteroidBelt from './AsteroidBelt.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { PLANETS_DATA } from '../data/planets.js'

// Only the sun is bright enough (above 1.0) to bloom. Tone mapping comes last
// so the HDR sun rolls off nicely instead of clipping.
function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={0.85}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.7}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <Vignette
        offset={0.28}
        darkness={0.65}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.02}
      />
    </EffectComposer>
  )
}

// Follows the focused planet each frame by translating camera + target
// by the delta the planet moved — preserves OrbitControls feel.
function CameraFollower({ focusedPlanetId, meshRegistry }) {
  const { camera, controls } = useThree()
  const prevPos    = useRef(new THREE.Vector3())
  const prevId     = useRef(null)

  useFrame(() => {
    if (!focusedPlanetId) {
      prevId.current = null
      return
    }

    const mesh = meshRegistry.current.get(focusedPlanetId)
    if (!mesh) return

    const currentPos = new THREE.Vector3()
    mesh.getWorldPosition(currentPos)

    // On first frame after focus change: just snapshot position, don't jump
    if (prevId.current !== focusedPlanetId) {
      prevPos.current.copy(currentPos)
      prevId.current = focusedPlanetId
      return
    }

    const delta = currentPos.clone().sub(prevPos.current)
    camera.position.add(delta)
    if (controls) {
      controls.target.add(delta)
      controls.update()
    }
    prevPos.current.copy(currentPos)
  })

  return null
}

function SolarSystem({
  onSelectPlanet,
  showOrbits,
  showLabels,
  isPaused,
  speedMultiplier,
  focusedPlanetId,
  meshRegistry,
}) {
  return (
    <>
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        minDistance={1.5}
        maxDistance={320}
        zoomSpeed={0.7}
        rotateSpeed={0.35}
        zoomToCursor
        makeDefault
      />

      <CameraFollower
        focusedPlanetId={focusedPlanetId}
        meshRegistry={meshRegistry}
      />

      <Starfield />

      <Suspense fallback={null}>
        <Sun />
        <AsteroidBelt isPaused={isPaused} speedMultiplier={speedMultiplier} />
        {PLANETS_DATA.map((planet) => (
          <Planet
            key={planet.id}
            data={planet}
            showOrbit={showOrbits}
            showLabel={showLabels}
            onClick={onSelectPlanet}
            isPaused={isPaused}
            speedMultiplier={speedMultiplier}
            registerMesh={(mesh) => meshRegistry.current.set(planet.id, mesh)}
          />
        ))}
      </Suspense>

      <PostFX />
    </>
  )
}

export default function Scene({
  onSelectPlanet,
  showOrbits,
  showLabels,
  isPaused,
  speedMultiplier,
  focusedPlanetId,
}) {
  // Shared registry: planetId → THREE.Mesh
  const meshRegistry = useRef(new Map())

  return (
    <ErrorBoundary>
      <Canvas
        camera={{ position: [0, 55, 130], fov: 55, near: 0.1, far: 2000 }}
        shadows
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
        }}
        style={{ background: '#000005' }}
      >
        <SolarSystem
          onSelectPlanet={onSelectPlanet}
          showOrbits={showOrbits}
          showLabels={showLabels}
          isPaused={isPaused}
          speedMultiplier={speedMultiplier}
          focusedPlanetId={focusedPlanetId}
          meshRegistry={meshRegistry}
        />
      </Canvas>
    </ErrorBoundary>
  )
}
