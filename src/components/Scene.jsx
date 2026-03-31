import { Suspense, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import Sun from './Sun.jsx'
import Planet from './Planet.jsx'
import Starfield from './Starfield.jsx'
import AsteroidBelt from './AsteroidBelt.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import { PLANETS_DATA } from '../data/planets.js'

function PostFX() {
  return (
    <EffectComposer multisampling={4}>
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.75}
        mipmapBlur
        radius={0.6}
      />
      <Noise
        premultiply
        blendFunction={BlendFunction.ADD}
        opacity={0.035}
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
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
      <Stars
        radius={450}
        depth={60}
        count={1500}
        factor={2.5}
        saturation={0.2}
        fade
        speed={0}
      />

      <Suspense fallback={null}>
        <Sun />
        <AsteroidBelt />
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
