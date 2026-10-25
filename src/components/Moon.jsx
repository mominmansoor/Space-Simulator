import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { getTexture, moonTextureId } from '../utils/proceduralTextures.js'

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

  const line = useMemo(() => {
    const l = new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x445566,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))
    l.raycast = () => {}
    return l
  }, [geo])

  return <primitive object={line} />
}

const MOON_SPEED = 0.22   // global speed scale for moon orbits

export default function Moon({ data, isPaused, speedMultiplier, showLabel }) {
  const orbitRef = useRef()
  const angleRef = useRef(Math.random() * Math.PI * 2)

  const texture = getTexture(moonTextureId(data))

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
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[data.radius, 24, 24]} />
            <meshStandardMaterial
              map={texture}
              color={texture ? '#ffffff' : data.color}
              roughness={0.95}
              metalness={0}
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
