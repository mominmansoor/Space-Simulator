import { useMemo, useEffect } from 'react'
import * as THREE from 'three'

// Orbit line that sits inside the planet's orbit group, so it turns with the
// planet. The line is brightest just behind the planet and fades around the
// loop, which reads as a little comet trail.

const vert = /* glsl */ `
  attribute float aT;
  varying float vT;
  void main() {
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vT;
  void main() {
    // vT = 0 at the planet, rising to 1 all the way round
    float trail = pow(1.0 - vT, 4.0);
    float a = uOpacity * (0.22 + 0.78 * trail);
    gl_FragColor = vec4(uColor * a, a);
  }
`

export default function OrbitRing({ radius, color = '#ffffff', opacity = 0.5, segments = 256 }) {
  const geometry = useMemo(() => {
    const pos = new Float32Array((segments + 1) * 3)
    const t = new Float32Array(segments + 1)
    for (let i = 0; i <= segments; i++) {
      const k = i / segments
      const a = k * Math.PI * 2
      pos[i * 3] = Math.cos(a) * radius
      pos[i * 3 + 2] = Math.sin(a) * radius
      t[i] = k
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aT', new THREE.BufferAttribute(t, 1))
    return g
  }, [radius, segments])

  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: vert,
    fragmentShader: frag,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color, opacity])

  const line = useMemo(() => {
    const l = new THREE.Line(geometry, material)
    l.raycast = () => {}
    return l
  }, [geometry, material])

  useEffect(() => () => { geometry.dispose(); material.dispose() }, [geometry, material])

  return <primitive object={line} />
}
