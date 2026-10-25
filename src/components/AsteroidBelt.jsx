import { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32, makeNoise3D } from '../utils/noise.js'

const ROCKS  = 1400
const DUST   = 3000
const INNER  = 27   // just outside Mars (orbit 23)
const OUTER  = 33   // just inside Jupiter (orbit 36)
const HEIGHT = 1.4  // vertical spread
const SPEED  = 0.6 * 0.15  // somewhere between Mars and Jupiter

// Lumpy rock: an icosphere pushed around by noise, shaded flat so the facets
// catch the sunlight.
function makeRockGeometry() {
  const g = new THREE.IcosahedronGeometry(1, 1)
  const n = makeNoise3D(7)
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const k = 1 + n(v.x * 1.7, v.y * 1.7, v.z * 1.7) * 0.45
    v.multiplyScalar(k)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  g.computeVertexNormals()
  return g
}

// Soft round dot so dust doesn't render as squares up close
function makeDotTexture() {
  const size = 32
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5) / size - 0.5, dy = (y + 0.5) / size - 0.5
      const a = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 2)
      const i = (y * size + x) * 4
      data[i] = data[i + 1] = data[i + 2] = 255
      data[i + 3] = Math.round(Math.pow(a, 1.5) * 255)
    }
  }
  const tex = new THREE.DataTexture(data, size, size)
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearFilter
  tex.needsUpdate = true
  return tex
}

// Radius biased toward the middle of the belt
function beltRadius(rand) {
  const t = (rand() + rand() + rand()) / 3
  return INNER + t * (OUTER - INNER)
}

export default function AsteroidBelt({ isPaused, speedMultiplier }) {
  const groupRef = useRef()
  const rocksRef = useRef()
  const geometry = useMemo(makeRockGeometry, [])
  const dot = useMemo(makeDotTexture, [])

  useLayoutEffect(() => {
    const mesh = rocksRef.current
    if (!mesh) return
    const rand = mulberry32(2024)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const c = new THREE.Color()
    for (let i = 0; i < ROCKS; i++) {
      const a = rand() * Math.PI * 2
      const r = beltRadius(rand)
      p.set(Math.cos(a) * r, (rand() - 0.5) * HEIGHT, Math.sin(a) * r)
      e.set(rand() * 6.28, rand() * 6.28, rand() * 6.28)
      q.setFromEuler(e)
      // mostly tiny, a few chunky ones
      const size = 0.03 + Math.pow(rand(), 4) * 0.16
      s.set(size * (0.7 + rand() * 0.6), size * (0.6 + rand() * 0.5), size * (0.7 + rand() * 0.6))
      m.compose(p, q, s)
      mesh.setMatrixAt(i, m)
      const g = 0.42 + rand() * 0.3
      c.setRGB(g * 1.05, g * 0.95, g * 0.85)
      mesh.setColorAt(i, c)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  const dust = useMemo(() => {
    const rand = mulberry32(99)
    const positions = new Float32Array(DUST * 3)
    const colors = new Float32Array(DUST * 3)
    for (let i = 0; i < DUST; i++) {
      const a = rand() * Math.PI * 2
      const r = beltRadius(rand)
      positions[i * 3]     = Math.cos(a) * r
      positions[i * 3 + 1] = (rand() - 0.5) * HEIGHT * 1.2
      positions[i * 3 + 2] = Math.sin(a) * r
      const g = 0.5 + rand() * 0.4
      colors[i * 3] = g; colors[i * 3 + 1] = g * 0.92; colors[i * 3 + 2] = g * 0.8
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current || isPaused) return
    groupRef.current.rotation.y += delta * SPEED * speedMultiplier
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={rocksRef} args={[geometry, undefined, ROCKS]} raycast={() => null}>
        <meshStandardMaterial flatShading roughness={1} metalness={0} />
      </instancedMesh>
      <points geometry={dust} raycast={() => null}>
        <pointsMaterial
          map={dot}
          size={0.08}
          vertexColors
          transparent
          opacity={0.35}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  )
}
