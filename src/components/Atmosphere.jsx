import { useMemo } from 'react'
import * as THREE from 'three'

// Glowing haze around a planet. Two shells:
//  - an outer back facing shell that glows past the edge of the planet
//  - a thin front facing shell that adds haze along the limb
// Both only light up on the side facing the sun (the sun sits at the origin).

const vert = /* glsl */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const frag = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uBack;
  uniform float uMaxD;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;
  void main() {
    vec3 n = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 sunDir = normalize(-vWorldPos);
    float glow;
    if (uBack > 0.5) {
      // back faces: brightest right next to the planet, zero at the shell edge
      float d = -dot(n, viewDir);
      glow = pow(clamp(d / uMaxD, 0.0, 1.0), uPower);
    } else {
      glow = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), uPower);
    }
    float day = smoothstep(-0.35, 0.5, dot(n, sunDir));
    float a = glow * day * uIntensity;
    gl_FragColor = vec4(uColor * a, a);
  }
`

function Shell({ radius, planetRadius, color, intensity, power, back }) {
  const uniforms = useMemo(() => {
    const k = planetRadius / radius
    return {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uPower: { value: power },
      uBack: { value: back ? 1 : 0 },
      // how far round the back of the shell you can see at the planet's limb
      uMaxD: { value: Math.sqrt(Math.max(1 - k * k, 1e-4)) },
    }
  }, [radius, planetRadius, color, intensity, power, back])

  return (
    <mesh raycast={() => null}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        vertexShader={vert}
        fragmentShader={frag}
        uniforms={uniforms}
        side={back ? THREE.BackSide : THREE.FrontSide}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default function Atmosphere({ radius, color, intensity = 1, thickness = 0.12 }) {
  return (
    <group>
      <Shell radius={radius * (1 + thickness)} planetRadius={radius} color={color} intensity={intensity} power={2.2} back />
      <Shell radius={radius * 1.005} planetRadius={radius} color={color} intensity={intensity * 0.8} power={2.6} />
    </group>
  )
}
