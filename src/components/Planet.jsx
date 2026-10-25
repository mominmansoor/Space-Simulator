import { useRef, useState, useCallback, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { gsap } from 'gsap'
import * as THREE from 'three'
import OrbitRing from './OrbitRing.jsx'
import Moon from './Moon.jsx'
import Atmosphere from './Atmosphere.jsx'
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

// Ring geometry with UVs remapped so u runs from the inner edge (0) to the
// outer edge (1). That lets a thin strip texture paint the ring bands.
function PlanetRings({ innerRadius, outerRadius, textureId }) {
  const texture = getTexture(textureId)
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(innerRadius, outerRadius, 192, 1)
    const pos = g.attributes.position
    const uv = g.attributes.uv
    const v = new THREE.Vector3()
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      uv.setXY(i, (v.length() - innerRadius) / (outerRadius - innerRadius), 0.5)
    }
    return g
  }, [innerRadius, outerRadius])

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow raycast={() => null}>
      <meshStandardMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        roughness={1}
        metalness={0}
        alphaTest={0.02}
      />
    </mesh>
  )
}

function Clouds({ radius, isPaused, speedMultiplier }) {
  const ref = useRef()
  const alpha = getTexture('earthClouds')
  useFrame((_, delta) => {
    if (ref.current && !isPaused) ref.current.rotation.y += delta * 0.02 * speedMultiplier
  })
  return (
    <mesh ref={ref} raycast={() => null}>
      <sphereGeometry args={[radius * 1.012, 64, 64]} />
      <meshStandardMaterial
        color="#ffffff"
        alphaMap={alpha}
        transparent
        depthWrite={false}
        roughness={1}
        metalness={0}
      />
    </mesh>
  )
}

function PlanetMesh({ data, showLabel, showOrbit, onClick, isPaused, speedMultiplier, registerMesh, moons }) {
  const orbitRef = useRef()
  const meshRef  = useRef()
  const glowRef  = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)
  const [hovered, setHovered] = useState(false)

  const { camera, controls } = useThree()
  const texture = getTexture(data.id)

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
      {showOrbit && (
        <OrbitRing radius={data.orbitRadius} color={data.ringColor ?? data.color} opacity={0.55} />
      )}
      <group position={[data.orbitRadius, 0, 0]}>
        {/* Moons orbit in the planet's local space, so they follow it automatically */}
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
            <sphereGeometry args={[data.radius, 96, 96]} />
            <meshStandardMaterial
              map={texture}
              color={texture ? '#ffffff' : data.color}
              roughness={data.id === 'earth' ? 0.7 : 0.9}
              metalness={0}
            />
          </mesh>

          {data.clouds && (
            <Clouds radius={data.radius} isPaused={isPaused} speedMultiplier={speedMultiplier} />
          )}

          {data.atmosphere && (
            <Atmosphere
              radius={data.radius}
              color={data.atmosphere.color}
              intensity={data.atmosphere.intensity}
              thickness={data.atmosphere.thickness}
            />
          )}

          {/* Hover glow shell */}
          <mesh ref={glowRef} raycast={() => null}>
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
            <PlanetRings
              innerRadius={data.ringInner}
              outerRadius={data.ringOuter}
              textureId={data.ringTexture}
            />
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
    <PlanetMesh
      data={data}
      moons={moons}
      showLabel={showLabel}
      showOrbit={showOrbit}
      onClick={onClick}
      isPaused={isPaused}
      speedMultiplier={speedMultiplier}
      registerMesh={registerMesh}
    />
  )
}
