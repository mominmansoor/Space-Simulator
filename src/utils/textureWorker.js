import { generateTexture } from './textureGen.js'

self.onmessage = (e) => {
  const { id } = e.data
  try {
    const { width, height, data } = generateTexture(id)
    self.postMessage({ id, width, height, data }, [data.buffer])
  } catch (err) {
    self.postMessage({ id, error: String(err) })
  }
}
