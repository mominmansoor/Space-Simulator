import { useRef, useState, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import OrbitRing from './OrbitRing.jsx'
import Moon from './Moon.jsx'
import { getTexture } from '../utils/proceduralTextures.js'
import { MOONS_DATA } from '../data/moons.js'

const SPEED_SCALE = 0.15

function PlanetLabel({ name, color }) {
  return (
    <Html center distanceFactor={18} style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <div style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color,
        textShadow: `0 0 8px ${color}`,
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        padding: '2px 6px',
        border: `1px solid ${color}44`,
        background: 'rgba(0,0,0,0.55)',
        borderRadius: '2px',
      }}>
        {name}
      </div>
    </Html>
  )
}

function PlanetRings({ innerRadius, outerRadius }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[innerRadius, outerRadius, 128]} />
      <meshBasicMaterial
        color="#d4b483"
        transparent
        opacity={0.45}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

function PlanetMesh({ data, showLabel, onClick, isPaused, speedMultiplier, registerMesh, moons }) {
  const orbitRef = useRef()
  const meshRef  = useRef()
  const glowRef  = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const [hovered, setHovered] = useState(false)

  const { camera, controls } = useThree()
  const texture = useMemo(() => getTexture(data.id), [data.id])

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (!meshRef.current) return

    const worldPos = new THREE.Vector3()
    meshRef.current.getWorldPosition(worldPos)

    const offset = data.radius * 5 + 4
    const targetCam = worldPos.clone().add(new THREE.Vector3(offset, offset * 0.35, offset))

    gsap.to(camera.position, {
      x: targetCam.x, y: targetCam.y, z: targetCam.z,
      duration: 1.8, ease: 'power3.inOut',
    })

    if (controls) {
      gsap.to(controls.target, {
        x: worldPos.x, y: worldPos.y, z: worldPos.z,
        duration: 1.8, ease: 'power3.inOut',
        onUpdate: () => controls.update(),
      })
    }

    onClick(data)
  }, [camera, controls, data, onClick])

  useFrame((_, delta) => {
    if (!orbitRef.current || !meshRef.current) return
    const dt = isPaused ? 0 : delta * SPEED_SCALE * speedMultiplier

    angleRef.current += data.orbitalSpeed * dt
    orbitRef.current.rotation.y = angleRef.current
    meshRef.current.rotation.y += data.rotationSpeed * dt * 2

    if (glowRef.current) {
      const target = hovered ? 0.22 : 0.0
      glowRef.current.material.opacity += (target - glowRef.current.material.opacity) * 0.12
    }
  })

  return (
    <group ref={orbitRef}>
      <group position={[data.orbitRadius, 0, 0]}>
        {/* Moons orbit in the planet's local space — they follow it automatically */}
        {moons?.map(moon => (
          <Moon
            key={moon.id}
            data={moon}
            isPaused={isPaused}
            speedMultiplier={speedMultiplier}
            showLabel={showLabel}
          />
        ))}

        <group rotation={[0, 0, THREE.MathUtils.degToRad(data.tilt ?? 0)]}>

          <mesh
            ref={(m) => { meshRef.current = m; if (m) registerMesh(m) }}
            castShadow
            receiveShadow
            onClick={handleClick}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
            userData={{ planetId: data.id }}
          >
            <sphereGeometry args={[data.radius, 64, 64]} />
            <meshStandardMaterial
              map={texture}
              roughness={0.85}
              metalness={0.05}
              emissive={new THREE.Color(data.emissiveColor)}
              emissiveIntensity={0.09}
            />
          </mesh>

          {/* Hover glow shell */}
          <mesh ref={glowRef}>
            <sphereGeometry args={[data.radius * 1.07, 32, 32]} />
            <meshBasicMaterial
              color={new THREE.Color(data.color)}
              transparent
              opacity={0}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>

          {data.hasRings && (
            <PlanetRings innerRadius={data.ringInner} outerRadius={data.ringOuter} />
          )}

          {showLabel && <PlanetLabel name={data.name} color={data.color} />}
        </group>
      </group>
    </group>
  )
}

export default function Planet({ data, showOrbit, showLabel, onClick, isPaused, speedMultiplier, registerMesh }) {
  const moons = MOONS_DATA[data.id] ?? []
  return (
    <>
      {showOrbit && (
        <OrbitRing
          radius={data.orbitRadius}
          color={data.ringColor ?? data.color}
          opacity={0.18}
        />
      )}
      <PlanetMesh
        data={data}
        moons={moons}
        showLabel={showLabel}
        onClick={onClick}
        isPaused={isPaused}
        speedMultiplier={speedMultiplier}
        registerMesh={registerMesh}
      />
    </>
  )
}
