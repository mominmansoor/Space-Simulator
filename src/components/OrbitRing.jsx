import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

export default function OrbitRing({ radius, color = '#ffffff', opacity = 0.15 }) {
  const ref = useRef()

  const points = useMemo(() => {
    const pts = []
    const segments = 180
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    }
    return pts
  }, [radius])

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [points])

  useEffect(() => {
    return () => geometry.dispose()
  }, [geometry])

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }))} />
  )
}
