import * as THREE from 'three'

// Simple deterministic pseudo-random based on seed
function seededRand(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Basic value noise on a canvas
function applyNoise(ctx, w, h, scale, amplitude, rand, r, g, b) {
  const img = ctx.getImageData(0, 0, w, h)
  const data = img.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x / w) * scale
      const ny = (y / h) * scale
      // cheap hash noise
      const n = Math.sin(nx * 127.1 + ny * 311.7) * 43758.5453
      const val = (n - Math.floor(n)) * amplitude - amplitude / 2
      const i = (y * w + x) * 4
      data[i]     = Math.min(255, Math.max(0, data[i]     + val * r))
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + val * g))
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + val * b))
    }
  }
  ctx.putImageData(img, 0, 0)
}

function makeCanvas(w = 512, h = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  return { canvas, ctx: canvas.getContext('2d') }
}

// ─── SUN ────────────────────────────────────────────────────────────────────
function makeSunTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  const grad = ctx.createRadialGradient(256, 128, 10, 256, 128, 260)
  grad.addColorStop(0,   '#fff7a0')
  grad.addColorStop(0.3, '#ffcc00')
  grad.addColorStop(0.6, '#ff9900')
  grad.addColorStop(0.85,'#ff6600')
  grad.addColorStop(1,   '#cc3300')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, 512, 256)
  applyNoise(ctx, 512, 256, 18, 60, seededRand(1), 1, 0.6, 0)
  applyNoise(ctx, 512, 256, 6,  40, seededRand(2), 1, 0.3, 0)
  return new THREE.CanvasTexture(canvas)
}

// ─── MERCURY ────────────────────────────────────────────────────────────────
function makeMercuryTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  ctx.fillStyle = '#9a9080'
  ctx.fillRect(0, 0, 512, 256)
  applyNoise(ctx, 512, 256, 22, 70, seededRand(3), 1, 1, 1)
  applyNoise(ctx, 512, 256, 8,  40, seededRand(4), 0.8, 0.8, 0.8)
  // craters
  const rand = seededRand(5)
  for (let i = 0; i < 60; i++) {
    const x = rand() * 512, y = rand() * 256
    const r = rand() * 12 + 3
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r)
    g2.addColorStop(0,   'rgba(60,55,50,0.6)')
    g2.addColorStop(0.6, 'rgba(80,75,70,0.3)')
    g2.addColorStop(1,   'rgba(160,155,140,0.15)')
    ctx.fillStyle = g2
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  return new THREE.CanvasTexture(canvas)
}

// ─── VENUS ──────────────────────────────────────────────────────────────────
function makeVenusTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  ctx.fillStyle = '#d4a84b'
  ctx.fillRect(0, 0, 512, 256)
  applyNoise(ctx, 512, 256, 6, 50, seededRand(6), 1, 0.7, 0.2)
  // horizontal cloud bands
  const rand = seededRand(7)
  for (let i = 0; i < 14; i++) {
    const y = rand() * 256
    const thickness = rand() * 20 + 6
    const grad = ctx.createLinearGradient(0, y - thickness, 0, y + thickness)
    grad.addColorStop(0,   'rgba(220,190,120,0)')
    grad.addColorStop(0.5, `rgba(240,210,140,${0.3 + rand() * 0.3})`)
    grad.addColorStop(1,   'rgba(220,190,120,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, y - thickness, 512, thickness * 2)
  }
  applyNoise(ctx, 512, 256, 12, 25, seededRand(8), 1, 0.8, 0.3)
  return new THREE.CanvasTexture(canvas)
}

// ─── EARTH ──────────────────────────────────────────────────────────────────
function makeEarthTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  // Ocean base
  ctx.fillStyle = '#1a5fa0'
  ctx.fillRect(0, 0, 512, 256)
  applyNoise(ctx, 512, 256, 8, 30, seededRand(9), 0, 0.5, 1)

  const rand = seededRand(10)
  // Continents (green/brown blobs)
  const continents = [
    { x: 110, y: 110, w: 80,  h: 55  },  // Americas
    { x: 260, y: 95,  w: 90,  h: 70  },  // Europe/Africa
    { x: 340, y: 90,  w: 100, h: 80  },  // Asia
    { x: 380, y: 170, w: 50,  h: 40  },  // Australia
    { x: 240, y: 200, w: 40,  h: 25  },  // S Africa
    { x: 60,  y: 80,  w: 30,  h: 20  },  // Greenland
  ]
  continents.forEach(({ x, y, w, h }) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(w, h))
    g.addColorStop(0,   '#4a8c3a')
    g.addColorStop(0.4, '#3d7a2e')
    g.addColorStop(0.7, '#6b5a2a')
    g.addColorStop(1,   'rgba(26,95,160,0)')
    ctx.fillStyle = g
    ctx.save(); ctx.scale(w / Math.max(w,h), h / Math.max(w,h))
    ctx.beginPath(); ctx.arc(x * Math.max(w,h)/w, y * Math.max(w,h)/h, Math.max(w,h), 0, Math.PI*2)
    ctx.fill(); ctx.restore()
  })

  // Ice caps
  const capN = ctx.createLinearGradient(0, 0, 0, 40)
  capN.addColorStop(0, 'rgba(240,248,255,0.9)')
  capN.addColorStop(1, 'rgba(240,248,255,0)')
  ctx.fillStyle = capN; ctx.fillRect(0, 0, 512, 40)
  const capS = ctx.createLinearGradient(0, 216, 0, 256)
  capS.addColorStop(0, 'rgba(240,248,255,0)')
  capS.addColorStop(1, 'rgba(240,248,255,0.9)')
  ctx.fillStyle = capS; ctx.fillRect(0, 216, 512, 40)

  // Clouds
  applyNoise(ctx, 512, 256, 5, 20, seededRand(11), 1, 1, 1)
  return new THREE.CanvasTexture(canvas)
}

// ─── MARS ───────────────────────────────────────────────────────────────────
function makeMarsTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  ctx.fillStyle = '#b5451b'
  ctx.fillRect(0, 0, 512, 256)
  applyNoise(ctx, 512, 256, 14, 60, seededRand(12), 1, 0.4, 0.1)
  applyNoise(ctx, 512, 256, 5,  30, seededRand(13), 0.8, 0.3, 0)

  // Polar ice cap
  const capN = ctx.createLinearGradient(0, 0, 0, 35)
  capN.addColorStop(0, 'rgba(240,235,220,0.85)')
  capN.addColorStop(1, 'rgba(240,235,220,0)')
  ctx.fillStyle = capN; ctx.fillRect(0, 0, 512, 35)

  // Valles Marineris-ish dark canyon band
  const grad = ctx.createLinearGradient(0, 118, 0, 138)
  grad.addColorStop(0,   'rgba(80,25,5,0)')
  grad.addColorStop(0.5, 'rgba(80,25,5,0.4)')
  grad.addColorStop(1,   'rgba(80,25,5,0)')
  ctx.fillStyle = grad; ctx.fillRect(100, 118, 300, 20)

  return new THREE.CanvasTexture(canvas)
}

// ─── JUPITER ────────────────────────────────────────────────────────────────
function makeJupiterTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  ctx.fillStyle = '#c8883a'
  ctx.fillRect(0, 0, 512, 256)

  // Horizontal bands
  const bands = [
    { y: 25,  h: 18, color: 'rgba(200,170,120,0.7)' },
    { y: 50,  h: 12, color: 'rgba(140,80,40,0.6)'  },
    { y: 70,  h: 22, color: 'rgba(230,200,150,0.65)'},
    { y: 98,  h: 14, color: 'rgba(160,90,45,0.6)'  },
    { y: 118, h: 20, color: 'rgba(210,175,120,0.55)'},
    { y: 144, h: 16, color: 'rgba(130,75,35,0.65)' },
    { y: 165, h: 24, color: 'rgba(225,195,140,0.6)'},
    { y: 195, h: 14, color: 'rgba(150,85,40,0.55)' },
    { y: 215, h: 18, color: 'rgba(200,165,110,0.6)'},
    { y: 238, h: 12, color: 'rgba(120,70,30,0.5)'  },
  ]
  bands.forEach(({ y, h, color }) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h)
    g.addColorStop(0,   color.replace(/[\d.]+\)$/, '0)'))
    g.addColorStop(0.5, color)
    g.addColorStop(1,   color.replace(/[\d.]+\)$/, '0)'))
    ctx.fillStyle = g; ctx.fillRect(0, y, 512, h)
  })

  // Great Red Spot
  const grs = ctx.createRadialGradient(320, 148, 0, 320, 148, 28)
  grs.addColorStop(0,   'rgba(180,60,30,0.8)')
  grs.addColorStop(0.5, 'rgba(160,50,25,0.6)')
  grs.addColorStop(1,   'rgba(200,140,80,0)')
  ctx.fillStyle = grs
  ctx.save(); ctx.scale(1.8, 1); ctx.beginPath()
  ctx.arc(320/1.8, 148, 28, 0, Math.PI*2); ctx.fill(); ctx.restore()

  applyNoise(ctx, 512, 256, 20, 18, seededRand(14), 1, 0.6, 0.2)
  return new THREE.CanvasTexture(canvas)
}

// ─── SATURN ─────────────────────────────────────────────────────────────────
function makeSaturnTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  ctx.fillStyle = '#e0d080'
  ctx.fillRect(0, 0, 512, 256)

  const bands = [
    { y: 30,  h: 20, color: 'rgba(200,185,100,0.5)' },
    { y: 60,  h: 15, color: 'rgba(170,155,80,0.45)'  },
    { y: 85,  h: 25, color: 'rgba(220,205,120,0.5)'  },
    { y: 120, h: 16, color: 'rgba(190,170,90,0.5)'   },
    { y: 145, h: 20, color: 'rgba(215,200,115,0.45)' },
    { y: 175, h: 18, color: 'rgba(180,165,85,0.4)'   },
    { y: 200, h: 22, color: 'rgba(205,195,110,0.45)' },
    { y: 230, h: 14, color: 'rgba(175,160,80,0.4)'   },
  ]
  bands.forEach(({ y, h, color }) => {
    ctx.fillStyle = color; ctx.fillRect(0, y, 512, h)
  })

  applyNoise(ctx, 512, 256, 18, 15, seededRand(15), 1, 0.9, 0.4)
  return new THREE.CanvasTexture(canvas)
}

// ─── URANUS ─────────────────────────────────────────────────────────────────
function makeUranusTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  const grad = ctx.createLinearGradient(0, 0, 0, 256)
  grad.addColorStop(0,   '#7dd8d8')
  grad.addColorStop(0.5, '#5abcbc')
  grad.addColorStop(1,   '#3da0a8')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256)
  applyNoise(ctx, 512, 256, 10, 18, seededRand(16), 0, 0.8, 1)
  // subtle banding
  for (let i = 0; i < 6; i++) {
    const y = 30 + i * 38
    const bg = ctx.createLinearGradient(0, y, 0, y + 20)
    bg.addColorStop(0,   'rgba(80,200,210,0)')
    bg.addColorStop(0.5, 'rgba(80,200,210,0.18)')
    bg.addColorStop(1,   'rgba(80,200,210,0)')
    ctx.fillStyle = bg; ctx.fillRect(0, y, 512, 20)
  }
  return new THREE.CanvasTexture(canvas)
}

// ─── NEPTUNE ────────────────────────────────────────────────────────────────
function makeNeptuneTexture() {
  const { canvas, ctx } = makeCanvas(512, 256)
  const grad = ctx.createLinearGradient(0, 0, 512, 256)
  grad.addColorStop(0,   '#2233aa')
  grad.addColorStop(0.5, '#1a3fcc')
  grad.addColorStop(1,   '#0d1f80')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 256)
  applyNoise(ctx, 512, 256, 8,  40, seededRand(17), 0, 0.2, 1)
  applyNoise(ctx, 512, 256, 20, 20, seededRand(18), 0, 0.3, 1)
  // Great Dark Spot
  const gds = ctx.createRadialGradient(200, 130, 0, 200, 130, 22)
  gds.addColorStop(0,   'rgba(5,10,60,0.7)')
  gds.addColorStop(0.7, 'rgba(10,20,80,0.35)')
  gds.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = gds
  ctx.save(); ctx.scale(1.6, 1); ctx.beginPath()
  ctx.arc(200/1.6, 130, 22, 0, Math.PI*2); ctx.fill(); ctx.restore()
  return new THREE.CanvasTexture(canvas)
}

// ─── Public API ─────────────────────────────────────────────────────────────
const generators = {
  sun:     makeSunTexture,
  mercury: makeMercuryTexture,
  venus:   makeVenusTexture,
  earth:   makeEarthTexture,
  mars:    makeMarsTexture,
  jupiter: makeJupiterTexture,
  saturn:  makeSaturnTexture,
  uranus:  makeUranusTexture,
  neptune: makeNeptuneTexture,
}

const cache = {}

export function getTexture(id) {
  if (!cache[id]) cache[id] = generators[id]?.() ?? null
  return cache[id]
}
