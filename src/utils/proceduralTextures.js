import * as THREE from 'three'
import { PLANETS_DATA } from '../data/planets.js'
import { MOONS_DATA } from '../data/moons.js'
import { generateTexture } from './textureGen.js'

// Textures are painted in Web Workers so the page stays smooth while they
// are made. The loading screen waits on preloadTextures(), and after that
// every component can grab its texture straight from the cache.

const cache = new Map()

// colour data goes through sRGB, alpha only data does not
const LINEAR_IDS = new Set(['earthClouds'])

export const moonTextureId = (moon) => `moon:${moon.id}:${moon.color}`

export function allTextureIds() {
  const ids = PLANETS_DATA.map((p) => p.id)
  ids.push('earthClouds', 'saturnRings', 'uranusRings')
  for (const list of Object.values(MOONS_DATA)) for (const m of list) ids.push(moonTextureId(m))
  return ids
}

function makeTexture(id, { width, height, data }) {
  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
  tex.colorSpace = LINEAR_IDS.has(id) ? THREE.NoColorSpace : THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.ClampToEdgeWrapping
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

let preloadPromise = null
let lastProgress = 0
const listeners = new Set()

// Safe to call more than once (React strict mode does): every caller gets
// progress updates and the same promise.
export function preloadTextures(onProgress) {
  if (onProgress) { listeners.add(onProgress); onProgress(lastProgress) }
  if (preloadPromise) return preloadPromise
  const ids = allTextureIds().filter((id) => !cache.has(id))
  const total = ids.length
  let done = 0
  const report = (p) => { lastProgress = p; for (const fn of listeners) fn(p) }
  const finish = (id, img) => {
    cache.set(id, makeTexture(id, img))
    done++
    report(done / total)
  }

  preloadPromise = new Promise((resolve) => {
    if (total === 0) { report(1); resolve(); return }

    let workers = []
    try {
      const n = Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1))
      for (let i = 0; i < n; i++) {
        workers.push(new Worker(new URL('./textureWorker.js', import.meta.url), { type: 'module' }))
      }
    } catch {
      workers = []
    }

    // No worker support: paint on the main thread, one texture per frame
    if (workers.length === 0) {
      const step = (i) => {
        if (i >= ids.length) { resolve(); return }
        finish(ids[i], generateTexture(ids[i]))
        requestAnimationFrame(() => step(i + 1))
      }
      step(0)
      return
    }

    const queue = [...ids]
    const inFlight = new Map()
    const feed = (w) => {
      const id = queue.shift()
      if (id) { inFlight.set(w, id); w.postMessage({ id }) }
      else { inFlight.delete(w); w.terminate() }
    }
    for (const w of workers) {
      w.onmessage = (e) => {
        const { id, error } = e.data
        finish(id, error ? generateTexture(id) : e.data)
        if (done === total) resolve()
        feed(w)
      }
      w.onerror = () => {
        // worker died: finish its job and whatever is left here
        w.terminate()
        const lost = inFlight.get(w)
        inFlight.delete(w)
        if (lost) finish(lost, generateTexture(lost))
        while (queue.length) {
          const id = queue.shift()
          finish(id, generateTexture(id))
        }
        if (done === total) resolve()
      }
      feed(w)
    }
  })
  return preloadPromise
}

export function getTexture(id) {
  return cache.get(id) ?? null
}
