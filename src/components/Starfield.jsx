import { useMemo } from 'react'
import * as THREE from 'three'

const STAR_COUNT = 6000

const vertexShader = /* glsl */`
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;

  void main() {
    vBrightness = aBrightness;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */`
  varying float vBrightness;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    float alpha = (1.0 - smoothstep(0.1, 0.5, dist)) * vBrightness;
    vec3 col = mix(vec3(0.7, 0.8, 1.0), vec3(1.0, 1.0, 1.0), vBrightness);
    gl_FragColor = vec4(col, alpha);
  }
`

export default function Starfield() {
  const { positions, sizes, brightnesses } = useMemo(() => {
    const positions    = new Float32Array(STAR_COUNT * 3)
    const sizes        = new Float32Array(STAR_COUNT)
    const brightnesses = new Float32Array(STAR_COUNT)

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta  = Math.random() * Math.PI * 2
      const phi    = Math.acos(2 * Math.random() - 1)
      const radius = 500 + Math.random() * 300

      positions[i * 3]     = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      sizes[i]        = 0.4 + Math.random() * 1.4
      brightnesses[i] = 0.3 + Math.random() * 0.7
    }
    return { positions, sizes, brightnesses }
  }, [])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={STAR_COUNT}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aSize"
          array={sizes}
          count={STAR_COUNT}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aBrightness"
          array={brightnesses}
          count={STAR_COUNT}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
