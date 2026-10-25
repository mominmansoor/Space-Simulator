// Small seeded noise toolkit used by the procedural textures.
// Everything is sampled on the surface of a unit sphere, so textures have no
// seam at the date line and no pinching at the poles.

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Improved Perlin noise, seeded. Returns roughly -1..1
export function makeNoise3D(seed = 1) {
  const rand = mulberry32(seed)
  const perm = new Uint8Array(512)
  const base = new Uint8Array(256)
  for (let i = 0; i < 256; i++) base[i] = i
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    const t = base[i]; base[i] = base[j]; base[j] = t
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255]

  const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10)
  const lerp = (a, b, t) => a + t * (b - a)
  const grad = (h, x, y, z) => {
    h &= 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v)
  }

  return (x, y, z) => {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z)
    const u = fade(x), v = fade(y), w = fade(z)
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z
    return lerp(
      lerp(lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
           lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u), v),
      lerp(lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
           lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u), v),
      w,
    )
  }
}

// Fractal noise: stacks octaves of noise for natural looking detail
export function fbm(noise, x, y, z, octaves = 5, lacunarity = 2, gain = 0.5) {
  let sum = 0, amp = 0.5, freq = 1
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise(x * freq, y * freq, z * freq)
    freq *= lacunarity
    amp *= gain
  }
  return sum
}

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a))
  return t * t * (3 - 2 * t)
}
export const mix = (a, b, t) => a + (b - a) * t

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

// Colour ramp: stops = [[0, '#000'], [0.5, '#f00'], [1, '#fff']]
export function makeRamp(stops) {
  const s = stops.map(([t, c]) => [t, hexToRgb(c)])
  return (t) => {
    t = clamp01(t)
    for (let i = 1; i < s.length; i++) {
      if (t <= s[i][0]) {
        const [t0, c0] = s[i - 1], [t1, c1] = s[i]
        const k = (t - t0) / (t1 - t0 || 1)
        return [mix(c0[0], c1[0], k), mix(c0[1], c1[1], k), mix(c0[2], c1[2], k)]
      }
    }
    return s[s.length - 1][1].slice()
  }
}

export function mixRgb(a, b, t) {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
}
