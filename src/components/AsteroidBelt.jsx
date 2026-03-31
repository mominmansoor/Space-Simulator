import { useMemo } from 'react'
import * as THREE from 'three'

const COUNT  = 3000
const INNER  = 27   // just outside Mars (orbit 23)
const OUTER  = 33   // just inside Jupiter (orbit 36)
const HEIGHT = 1.4  // vertical spread

export default function AsteroidBelt() {
  const { positions, sizes } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const sizes     = new Float32Array(COUNT)

    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2
      // Bias density toward center of belt
      const t = Math.pow(Math.random(), 0.7)
      const r = INNER + t * (OUTER - INNER)

      positions[i * 3]     = Math.cos(angle) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * HEIGHT
      positions[i * 3 + 2] = Math.sin(angle) * r

      sizes[i] = 0.08 + Math.random() * 0.18
    }
    return { positions, sizes }
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#aaa090"
        transparent
        opacity={0.55}
        depthWrite={false}
        sizeAttenuation
        vertexColors={false}
      />
    </points>
  )
}
