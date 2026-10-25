import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mulberry32 } from '../utils/noise.js'

const STAR_COUNT = 7000
const BAND_COUNT = 14000
const HAZE_COUNT = 500

const vertexShader = /* glsl */`
  attribute float aSize;
  attribute float aBrightness;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uTwinkle;
  varying float vBrightness;
  varying vec3 vColor;

  void main() {
    float tw = 1.0 - uTwinkle + uTwinkle * (0.5 + 0.5 * sin(uTime * (0.6 + aPhase) + aPhase * 40.0));
    vBrightness = aBrightness * tw;
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = /* glsl */`
  uniform float uSoft;
  varying float vBrightness;
  varying vec3 vColor;

  void main() {
    vec2 uv = gl_PointCoord - vec2(0.5);
    float dist = length(uv);
    if (dist > 0.5) discard;
    float core = 1.0 - smoothstep(0.0, 0.5, dist);
    float alpha = pow(core, mix(1.6, 3.0, uSoft)) * vBrightness;
    gl_FragColor = vec4(vColor * alpha, alpha);
  }
`

// Star colours from hot blue-white to cool orange, weighted toward white
const STAR_COLORS = ['#9bb0ff', '#aabfff', '#cad7ff', '#f8f7ff', '#fff4ea', '#ffe8c6', '#ffd2a1', '#ffb56c']
const pickColor = (rand) => {
  const t = Math.pow(rand(), 1.4)
  const c = new THREE.Color(STAR_COLORS[Math.min(STAR_COLORS.length - 1, Math.floor((0.25 + t * 0.6) * STAR_COLORS.length))])
  if (rand() < 0.12) c.set(STAR_COLORS[0])
  if (rand() < 0.08) c.set(STAR_COLORS[7])
  return c
}

// Points spread over a sphere shell. If band is set, they cluster along a
// tilted great circle like the Milky Way.
function build(count, seed, { band = false, sizes, bright, haze = false }) {
  const rand = mulberry32(seed)
  const positions = new Float32Array(count * 3)
  const size = new Float32Array(count)
  const brightness = new Float32Array(count)
  const phase = new Float32Array(count)
  const color = new Float32Array(count * 3)
  const tilt = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0.9, 0.3, 0.5))
  const v = new THREE.Vector3()
  const gauss = () => (rand() + rand() + rand() + rand() - 2) / 2

  for (let i = 0; i < count; i++) {
    const radius = 520 + rand() * 280
    if (band) {
      const lon = rand() * Math.PI * 2
      // thicker toward the galactic core
      const core = Math.pow(Math.max(0, Math.cos(lon - 1.2)), 3)
      const lat = gauss() * (0.09 + core * 0.16)
      v.set(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon))
      v.applyMatrix4(tilt)
    } else {
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      v.set(Math.sin(phi) * Math.cos(theta), Math.sin(phi) * Math.sin(theta), Math.cos(phi))
    }
    v.multiplyScalar(radius)
    positions[i * 3] = v.x; positions[i * 3 + 1] = v.y; positions[i * 3 + 2] = v.z

    size[i] = sizes[0] + Math.pow(rand(), 3) * (sizes[1] - sizes[0])
    brightness[i] = bright[0] + rand() * (bright[1] - bright[0])
    phase[i] = rand()
    const c = haze
      ? new THREE.Color().setHSL(0.6 + rand() * 0.2, 0.5, 0.55)
      : pickColor(rand)
    color[i * 3] = c.r; color[i * 3 + 1] = c.g; color[i * 3 + 2] = c.b
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1))
  g.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
  g.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1))
  g.setAttribute('aColor', new THREE.BufferAttribute(color, 3))
  return g
}

function Layer({ geometry, twinkle = 0, soft = 0 }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uTime: { value: 0 }, uTwinkle: { value: twinkle }, uSoft: { value: soft } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [twinkle, soft])
  useFrame(({ clock }) => { material.uniforms.uTime.value = clock.getElapsedTime() })
  return <points geometry={geometry} material={material} raycast={() => null} frustumCulled={false} />
}

export default function Starfield() {
  const stars = useMemo(() => build(STAR_COUNT, 1, { sizes: [0.6, 3.2], bright: [0.35, 1.0] }), [])
  const band = useMemo(() => build(BAND_COUNT, 2, { band: true, sizes: [0.4, 1.4], bright: [0.12, 0.45] }), [])
  const haze = useMemo(() => build(HAZE_COUNT, 3, { band: true, haze: true, sizes: [40, 110], bright: [0.015, 0.04] }), [])

  return (
    <group>
      <Layer geometry={haze} soft={1} />
      <Layer geometry={band} />
      <Layer geometry={stars} twinkle={0.35} />
    </group>
  )
}
