import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SUN_DATA } from '../data/planets.js'
import { getTexture } from '../utils/proceduralTextures.js'

export default function Sun() {
  const meshRef = useRef()
  const glowRef = useRef()
  const texture = useMemo(() => getTexture('sun'), [])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (meshRef.current) meshRef.current.rotation.y = t * 0.05
    if (glowRef.current) {
      const s = 1.0 + Math.sin(t * 1.2) * 0.015
      glowRef.current.scale.setScalar(s)
      glowRef.current.material.opacity = 0.12 + Math.sin(t * 0.8) * 0.04
    }
  })

  return (
    <group>
      {/* Core sun */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_DATA.radius, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          emissive={new THREE.Color(SUN_DATA.emissiveColor)}
          emissiveMap={texture}
          emissiveIntensity={1.2}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Inner corona */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[SUN_DATA.radius * 1.15, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color('#ff6600')}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer halo */}
      <mesh>
        <sphereGeometry args={[SUN_DATA.radius * 1.6, 32, 32]} />
        <meshBasicMaterial
          color={new THREE.Color('#ff9900')}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <pointLight
        color="#fff5e0"
        intensity={8}
        distance={500}
        decay={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <ambientLight color="#0a0f1a" intensity={0.3} />
    </group>
  )
}
