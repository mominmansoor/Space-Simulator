import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

/**
 * Tracks the real-time distance of the selected planet from the Sun (origin).
 * Returns the distance in AU equivalents based on scaled orbit radius.
 * Earth orbit radius = 17 units → 1.0 AU, so scale = 1/17 AU per unit.
 */
const AU_SCALE = 1 / 17

export function usePlanetDistance(selectedPlanet, sceneRef) {
  const [distance, setDistance] = useState(null)
  const frameRef = useRef()

  useEffect(() => {
    if (!selectedPlanet) {
      setDistance(null)
      return
    }

    // Poll every animation frame
    const update = () => {
      if (sceneRef?.current) {
        // Find the planet mesh by name
        let found = null
        sceneRef.current.traverse((obj) => {
          if (obj.isMesh && obj.userData.planetId === selectedPlanet.id) {
            found = obj
          }
        })
        if (found) {
          const worldPos = new THREE.Vector3()
          found.getWorldPosition(worldPos)
          const distUnits = worldPos.length()
          setDistance(distUnits * AU_SCALE)
        } else {
          // Fallback: use orbit radius
          setDistance(selectedPlanet.orbitRadius * AU_SCALE)
        }
      } else {
        // Fallback: use orbit radius
        setDistance(selectedPlanet.orbitRadius * AU_SCALE)
      }
      frameRef.current = requestAnimationFrame(update)
    }

    frameRef.current = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frameRef.current)
  }, [selectedPlanet, sceneRef])

  return distance
}
