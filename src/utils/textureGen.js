// Pure texture painters. No DOM and no three.js in here, so this file can run
// inside a Web Worker and keep the page smooth while textures are made.
//
// Every planet texture is painted pixel by pixel. Each pixel is turned into a
// point on a unit sphere and the noise is sampled there, so there is no seam
// where the texture wraps and no stretching at the poles.

import {
  makeNoise3D, fbm, mulberry32, makeRamp, mixRgb, smoothstep, clamp01, hexToRgb,
} from './noise.js'

function paintSphere(w, h, shade) {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    // row 0 is the south pole (WebGL data texture convention)
    const lat = ((y + 0.5) / h - 0.5) * Math.PI
    const cl = Math.cos(lat), sl = Math.sin(lat)
    for (let x = 0; x < w; x++) {
      const lon = ((x + 0.5) / w) * Math.PI * 2 - Math.PI
      const px = cl * Math.cos(lon), py = sl, pz = cl * Math.sin(lon)
      const c = shade(px, py, pz, lat, lon)
      const i = (y * w + x) * 4
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2]; data[i + 3] = c[3] ?? 255
    }
  }
  return { width: w, height: h, data }
}

// Craters scattered on the sphere. Returns a function giving a shading
// offset (dark floor, bright rim) for any point.
function makeCraters(seed, count, minR, maxR) {
  const rand = mulberry32(seed)
  const list = []
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1, t = rand() * Math.PI * 2
    const s = Math.sqrt(1 - u * u)
    const r = minR + Math.pow(rand(), 2.2) * (maxR - minR)
    list.push([s * Math.cos(t), u, s * Math.sin(t), r])
  }
  return (x, y, z) => {
    let v = 0
    for (let i = 0; i < list.length; i++) {
      const c = list[i]
      const dx = x - c[0], dy = y - c[1], dz = z - c[2]
      const dist2 = dx * dx + dy * dy + dz * dz
      const r = c[3]
      if (dist2 > r * r * 1.7) continue
      const k = Math.sqrt(dist2) / r
      if (k < 0.85) v -= 0.22 * (1 - k * 0.5)
      else if (k < 1.15) v += 0.18 * (1 - Math.abs(k - 1) / 0.15)
      else v -= 0.03
    }
    return v
  }
}

// ─── MERCURY ────────────────────────────────────────────────────────────────
function makeMercuryTexture() {
  const n = makeNoise3D(21)
  const craters = makeCraters(22, 140, 0.03, 0.22)
  const ramp = makeRamp([[0, '#3f3a36'], [0.5, '#7d756c'], [1, '#bdb4a6']])
  return paintSphere(1024, 512, (x, y, z) => {
    let v = 0.5 + fbm(n, x * 3, y * 3, z * 3, 6) * 0.8
    v += craters(x, y, z)
    return ramp(v)
  })
}

// ─── VENUS ──────────────────────────────────────────────────────────────────
function makeVenusTexture() {
  const n = makeNoise3D(31)
  const ramp = makeRamp([[0, '#a8702c'], [0.4, '#d9a65a'], [0.7, '#ecd09a'], [1, '#fbf0d2']])
  return paintSphere(1024, 512, (x, y, z) => {
    const q = fbm(n, x * 2, y * 2, z * 2, 4)
    const w = fbm(n, x * 1.5 + q * 2, y * 5 + q * 3, z * 1.5 + q * 2, 5)
    return ramp(0.55 + w * 0.9)
  })
}

// ─── EARTH ──────────────────────────────────────────────────────────────────
function makeEarthTexture() {
  const n = makeNoise3D(41)
  const n2 = makeNoise3D(42)
  const deep = hexToRgb('#06204a'), shallow = hexToRgb('#1d6aa5')
  const green = hexToRgb('#3c6b2a'), dark = hexToRgb('#24451b')
  const desert = hexToRgb('#b99c63'), rock = hexToRgb('#6e604c'), ice = hexToRgb('#eef4f8')
  return paintSphere(1024, 512, (x, y, z, lat) => {
    const e = fbm(n, x * 1.6, y * 1.6, z * 1.6, 7) - 0.06
    const absLat = Math.abs(lat) / (Math.PI / 2)
    const capNoise = fbm(n2, x * 4, y * 4, z * 4, 3) * 0.08
    if (absLat + capNoise > 0.92) return ice
    if (e < 0.04) return mixRgb(deep, shallow, smoothstep(-0.25, 0.04, e))
    const height = smoothstep(0.04, 0.4, e)
    const dry = smoothstep(0.35, 0.7, 1 - Math.abs(absLat - 0.27) * 5 + fbm(n2, x * 3, y * 3, z * 3, 4) * 1.4)
    let c = mixRgb(green, dark, smoothstep(-0.3, 0.3, fbm(n2, x * 6, y * 6, z * 6, 3)))
    c = mixRgb(c, desert, dry * 0.8)
    c = mixRgb(c, rock, smoothstep(0.35, 0.75, height))
    c = mixRgb(c, ice, smoothstep(0.78, 0.9, absLat + capNoise) * 0.8 + smoothstep(0.9, 1.0, height) * 0.5)
    return c
  })
}

function makeEarthClouds() {
  const n = makeNoise3D(43)
  return paintSphere(1024, 512, (x, y, z, lat) => {
    const warp = fbm(n, x * 2, y * 2, z * 2, 3)
    const v = fbm(n, x * 3 + warp * 1.5, y * 5 + warp, z * 3 + warp * 1.5, 6)
    const bands = 0.55 + 0.45 * Math.cos(lat * 6)
    const a = Math.round(smoothstep(0.02, 0.38, v + bands * 0.12 - 0.05) * 230)
    // alphaMap is read from the green channel, so coverage goes in rgb
    return [a, a, a, 255]
  })
}

// ─── MARS ───────────────────────────────────────────────────────────────────
function makeMarsTexture() {
  const n = makeNoise3D(51)
  const n2 = makeNoise3D(52)
  const craters = makeCraters(53, 40, 0.02, 0.09)
  const ramp = makeRamp([[0, '#5b2414'], [0.35, '#94401d'], [0.65, '#c0612f'], [1, '#e19a63']])
  const ice = hexToRgb('#f1e9df')
  return paintSphere(1024, 512, (x, y, z) => {
    let v = 0.55 + fbm(n, x * 2.5, y * 2.5, z * 2.5, 6) * 0.9
    const maria = smoothstep(0.05, 0.3, fbm(n2, x * 1.4, y * 1.4, z * 1.4, 4))
    v -= maria * 0.35
    v += craters(x, y, z) * 0.35
    const c = ramp(v)
    const edge = fbm(n2, x * 5, y * 5, z * 5, 3)
    const capN = smoothstep(0.93, 0.96, y + edge * 0.05)
    const capS = smoothstep(0.95, 0.975, -y + edge * 0.04)
    return mixRgb(c, ice, Math.max(capN, capS))
  })
}

// ─── GAS GIANTS ─────────────────────────────────────────────────────────────
// Bands come from a 1D lookup by latitude, then get pushed around by stretched
// noise so they swirl and streak like real cloud belts.
function makeBandTable(seed, palette, count) {
  const rand = mulberry32(seed)
  const cols = []
  for (let i = 0; i <= count; i++) cols.push(hexToRgb(palette[Math.floor(rand() * palette.length)]))
  return (t) => {
    t = clamp01(t) * count
    const i = Math.floor(t), k = t - i
    const s = k * k * (3 - 2 * k)
    return mixRgb(cols[i], cols[Math.min(i + 1, count)], s)
  }
}

function makeGiant({ seed, palette, bands, turbulence, streak, w = 1024, h = 512, extra }) {
  const n = makeNoise3D(seed)
  const n2 = makeNoise3D(seed + 1)
  const table = makeBandTable(seed + 2, palette, bands)
  return paintSphere(w, h, (x, y, z, lat, lon) => {
    const warp = fbm(n, x * 3, y * 3, z * 3, 5) * turbulence
             + fbm(n2, x * 2, y * 30, z * 2, 3) * streak
    let c = table(0.5 + y * 0.5 + warp)
    const fine = fbm(n2, x * 8, y * 40, z * 8, 3) * 18
    c = [c[0] + fine, c[1] + fine, c[2] + fine]
    if (extra) c = extra(c, x, y, z, lat, lon, n)
    return c
  })
}

function storm(lat0, lon0, rx, ry, color, strength) {
  const col = hexToRgb(color)
  return (c, x, y, z, lat, lon, n) => {
    let dl = lon - lon0
    if (dl > Math.PI) dl -= Math.PI * 2
    if (dl < -Math.PI) dl += Math.PI * 2
    const dx = dl / rx, dy = (lat - lat0) / ry
    const r = Math.sqrt(dx * dx + dy * dy)
    if (r > 1.6) return c
    const swirl = n(Math.atan2(dy, dx) * 1.5 + r * 6, r * 4, 0.5) * 0.25
    const core = smoothstep(1.05, 0.2, r + swirl)
    const rim = smoothstep(1.5, 1.05, r) * (1 - core) * 0.35
    const out = mixRgb(c, col, core * strength)
    return mixRgb(out, [245, 230, 205], rim)
  }
}

function makeJupiterTexture() {
  return makeGiant({
    seed: 61,
    palette: ['#efe2c6', '#e2c8a0', '#c99a6b', '#a8704a', '#8a5638', '#d7b68c', '#b9825a', '#f3ead6'],
    bands: 28,
    turbulence: 0.032,
    streak: 0.014,
    extra: storm(-0.38, 0.9, 0.34, 0.13, '#b4522f', 0.8),
  })
}

function makeSaturnTexture() {
  return makeGiant({
    seed: 71,
    palette: ['#efe0b5', '#e3cf98', '#d4b87d', '#c7a76c', '#f2e7c6', '#dcc68c'],
    bands: 22,
    turbulence: 0.012,
    streak: 0.008,
  })
}

function makeUranusTexture() {
  return makeGiant({
    seed: 81,
    palette: ['#a6e4e6', '#93d8dc', '#9fdfe2', '#86ccd3', '#b2eaeb'],
    bands: 10,
    turbulence: 0.01,
    streak: 0.004,
    w: 768, h: 384,
  })
}

function makeNeptuneTexture() {
  const spot = storm(-0.35, -0.6, 0.2, 0.08, '#1b2c80', 0.55)
  return makeGiant({
    seed: 91,
    palette: ['#2f4fc4', '#2643ad', '#3a5fd6', '#1f3794', '#4a72e0'],
    bands: 14,
    turbulence: 0.02,
    streak: 0.01,
    w: 768, h: 384,
    extra: (c, x, y, z, lat, lon, n) => {
      c = spot(c, x, y, z, lat, lon, n)
      const streaks = smoothstep(0.35, 0.6, n(x * 3, y * 26, z * 3) + n(x * 7, y * 7, z * 7) * 0.3)
      return mixRgb(c, [225, 235, 255], streaks * 0.4)
    },
  })
}

// ─── RINGS ──────────────────────────────────────────────────────────────────
// A strip where x runs from the inner edge to the outer edge of the ring.
function makeRingStrip({ seed, color, gaps, density, grooves = true }) {
  const w = 1024, h = 4
  const data = new Uint8ClampedArray(w * h * 4)
  const n = makeNoise3D(seed)
  const base = hexToRgb(color)
  for (let x = 0; x < w; x++) {
    const r = x / (w - 1)
    let a = density(r)
    a *= 0.75 + 0.25 * (fbm(n, r * 40, 0.5, 0.5, 4) + 0.5)
    if (grooves) a *= 0.85 + 0.15 * Math.sin(r * 420)
    for (const [c, wd] of gaps) a *= smoothstep(0, wd, Math.abs(r - c))
    a *= smoothstep(0, 0.02, r) * smoothstep(1, 0.97, r)
    const shade = 0.75 + 0.35 * (fbm(n, r * 12, 2.5, 1.5, 3) + 0.5)
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4
      data[i] = base[0] * shade
      data[i + 1] = base[1] * shade
      data[i + 2] = base[2] * shade
      data[i + 3] = Math.round(clamp01(a) * 255)
    }
  }
  return { width: w, height: h, data }
}

function makeSaturnRings() {
  return makeRingStrip({
    seed: 101,
    color: '#dcc8a0',
    // Cassini division and Encke gap
    gaps: [[0.63, 0.035], [0.9, 0.008]],
    density: (r) => (r < 0.22 ? 0.25 : r < 0.6 ? 0.95 : 0.7),
  })
}

function makeUranusRings() {
  return makeRingStrip({
    seed: 111,
    color: '#b8c6c8',
    gaps: [],
    grooves: false,
    density: (r) => {
      const rings = [0.2, 0.36, 0.5, 0.94]
      let a = 0
      for (const c of rings) a = Math.max(a, smoothstep(0.012, 0, Math.abs(r - c)))
      return a * 0.45
    },
  })
}

// ─── MOONS ──────────────────────────────────────────────────────────────────
function makeMoonTexture(id, color) {
  const seed = id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0
  const n = makeNoise3D(seed)
  const craters = makeCraters(seed + 1, 50, 0.04, 0.25)
  const base = hexToRgb(color)
  return paintSphere(256, 128, (x, y, z) => {
    const v = 1 + fbm(n, x * 3, y * 3, z * 3, 5) * 0.55 + craters(x, y, z) * 0.9
    return [base[0] * v, base[1] * v, base[2] * v]
  })
}

// ─── Public API ─────────────────────────────────────────────────────────────
const generators = {
  mercury: makeMercuryTexture,
  venus: makeVenusTexture,
  earth: makeEarthTexture,
  earthClouds: makeEarthClouds,
  mars: makeMarsTexture,
  jupiter: makeJupiterTexture,
  saturn: makeSaturnTexture,
  saturnRings: makeSaturnRings,
  uranus: makeUranusTexture,
  uranusRings: makeUranusRings,
  neptune: makeNeptuneTexture,
}

// ids look like "earth", or "moon:<moonId>:<hex colour>" for moons
export function generateTexture(id) {
  if (id.startsWith('moon:')) {
    const [, moonId, color] = id.split(':')
    return makeMoonTexture(moonId, color)
  }
  const gen = generators[id]
  if (!gen) throw new Error(`no texture generator for ${id}`)
  return gen()
}
