import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

// Moons use a tiny procedural canvas texture — just tinted noise, no external fetch
function makeMoonTexture(color, seed) {
  const canvas = document.createElement('canvas')
  canvas.width = 128; canvas.height = 64
  const ctx = canvas.getContext('2d')
  const c = new THREE.Color(color)
  ctx.fillStyle = `rgb(${Math.floor(c.r*255)},${Math.floor(c.g*255)},${Math.floor(c.b*255)})`
  ctx.fillRect(0, 0, 128, 64)
  // cheap noise overlay
  const img = ctx.getImageData(0, 0, 128, 64)
  let s = seed
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * 45
    img.data[i]     = Math.min(255, Math.max(0, img.data[i]     + n))
    img.data[i + 1] = Math.min(255, Math.max(0, img.data[i + 1] + n * 0.95))
    img.data[i + 2] = Math.min(255, Math.max(0, img.data[i + 2] + n * 0.9))
  }
  ctx.putImageData(img, 0, 0)
  return new THREE.CanvasTexture(canvas)
}

// One thin line loop for the moon orbit
function MoonOrbitRing({ radius }) {
  const geo = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [radius])

  return (
    <primitive object={new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x445566,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))} />
  )
}

const MOON_SPEED = 0.22   // global speed scale for moon orbits

export default function Moon({ data, isPaused, speedMultiplier, showLabel }) {
  const orbitRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)

  // seed from id chars so same moon always gets same texture
  const seed = useMemo(() => data.id.split('').reduce((a, c) => a + c.charCodeAt(0), 1), [data.id])
  const texture = useMemo(() => makeMoonTexture(data.color, seed * 31), [data.color, seed])

  useFrame((_, delta) => {
    if (!orbitRef.current) return
    const dt = isPaused ? 0 : delta * MOON_SPEED * speedMultiplier
    angleRef.current += data.orbitalSpeed * dt
    orbitRef.current.rotation.y = angleRef.current
  })

  return (
    <group>
      <MoonOrbitRing radius={data.orbitRadius} />
      <group ref={orbitRef}>
        <group position={[data.orbitRadius, 0, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[data.radius, 24, 24]} />
            <meshStandardMaterial
              map={texture}
              roughness={0.9}
              metalness={0}
              emissive={new THREE.Color(data.emissiveColor)}
              emissiveIntensity={0.05}
            />
          </mesh>
          {showLabel && (
            <Html center distanceFactor={8} style={{ pointerEvents: 'none', userSelect: 'none' }}>
              <div style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '9px',
                color: data.color,
                textShadow: `0 0 6px ${data.color}`,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                padding: '1px 4px',
                border: `1px solid ${data.color}33`,
                background: 'rgba(0,0,0,0.6)',
                borderRadius: '2px',
                opacity: 0.8,
              }}>
                {data.name}
              </div>
            </Html>
          )}
        </group>
      </group>
    </group>
  )
}
