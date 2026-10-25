import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { SUN_DATA } from '../data/planets.js'
import { noiseGLSL } from '../shaders/noise.glsl.js'

// The surface is a shader: boiling granulation from animated noise, darker at
// the edge of the disc like the real sun. Values go above 1.0 on purpose so
// the bloom pass picks the sun up and nothing else.
const surfaceVert = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vViewNormal;
  void main() {
    vPos = position;
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const surfaceFrag = /* glsl */ `
  uniform float uTime;
  uniform float uRadius;
  varying vec3 vPos;
  varying vec3 vViewNormal;
  ${noiseGLSL}

  vec3 ramp(float t) {
    vec3 a = vec3(0.55, 0.08, 0.0);
    vec3 b = vec3(1.0, 0.32, 0.02);
    vec3 c = vec3(1.0, 0.62, 0.16);
    vec3 d = vec3(1.0, 0.95, 0.75);
    if (t < 0.4) return mix(a, b, t / 0.4);
    if (t < 0.75) return mix(b, c, (t - 0.4) / 0.35);
    return mix(c, d, (t - 0.75) / 0.25);
  }

  void main() {
    vec3 p = normalize(vPos);
    float t = uTime * 0.04;
    // slow big convection cells, warped by smaller fast ones
    vec3 warp = vec3(fbm3(p * 2.0 + t), fbm3(p * 2.0 - t + 4.1), fbm3(p * 2.0 + 9.7));
    float cells = fbm3(p * 9.0 + warp * 0.9 + t * 1.5);
    float grain = snoise(p * 60.0 + t * 6.0) * 0.1;
    float v = 0.62 + cells * 0.6 + grain;

    // sunspots: rare dark blotches
    float spots = smoothstep(0.72, 0.82, snoise(p * 2.5 + vec3(0.0, t * 0.3, 0.0)));
    v -= spots * 0.25;

    float facing = clamp(dot(vViewNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    float limb = 0.45 + 0.55 * pow(facing, 0.45);
    vec3 col = ramp(clamp(v, 0.0, 1.0)) * limb;
    col *= mix(1.0, 0.3, spots);
    gl_FragColor = vec4(col * 1.3, 1.0);
  }
`

// A camera facing quad around the sun: soft glow plus faint moving streamers.
const coronaVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const coronaFrag = /* glsl */ `
  uniform float uTime;
  uniform float uInner;
  varying vec2 vUv;
  ${noiseGLSL}
  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float a = atan(p.y, p.x);
    // distance from the surface of the sun, 0 at the limb
    float d = max(r - uInner, 0.0) / (1.0 - uInner);
    float glow = exp(-d * 7.0) * 0.7 + exp(-d * 2.6) * 0.14;
    float rays = snoise(vec3(cos(a) * 3.0, sin(a) * 3.0, uTime * 0.05)) * 0.5 + 0.5;
    rays = pow(rays, 3.0) * exp(-d * 3.5) * 0.35;
    float fade = smoothstep(1.0, 0.75, r);
    float intensity = (glow + rays) * fade;
    vec3 col = mix(vec3(1.0, 0.45, 0.08), vec3(1.0, 0.8, 0.45), exp(-d * 4.0));
    gl_FragColor = vec4(col * intensity * 1.1, intensity);
  }
`

export default function Sun() {
  const surfaceRef = useRef()
  const coronaMat = useRef()

  const surfaceUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uRadius: { value: SUN_DATA.radius },
  }), [])

  const coronaSize = SUN_DATA.radius * 7
  const coronaUniforms = useMemo(() => ({
    uTime: { value: 0 },
    // sun radius as a fraction of the quad's half width
    uInner: { value: SUN_DATA.radius / (coronaSize / 2) },
  }), [coronaSize])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    surfaceUniforms.uTime.value = t
    coronaUniforms.uTime.value = t
    if (surfaceRef.current) surfaceRef.current.rotation.y = t * 0.02
  })

  return (
    <group>
      <mesh ref={surfaceRef}>
        <sphereGeometry args={[SUN_DATA.radius, 96, 96]} />
        <shaderMaterial
          vertexShader={surfaceVert}
          fragmentShader={surfaceFrag}
          uniforms={surfaceUniforms}
          toneMapped={false}
        />
      </mesh>

      <Billboard>
        <mesh renderOrder={-1}>
          <planeGeometry args={[coronaSize, coronaSize]} />
          <shaderMaterial
            ref={coronaMat}
            vertexShader={coronaVert}
            fragmentShader={coronaFrag}
            uniforms={coronaUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      {/* decay 0 keeps the outer planets lit instead of fading to black */}
      <pointLight
        color="#fff1dc"
        intensity={2.4}
        distance={0}
        decay={0}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <ambientLight color="#1a2238" intensity={0.35} />
    </group>
  )
}
