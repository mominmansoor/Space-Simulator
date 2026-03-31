import { useState, useCallback } from 'react'

export function useSolarSystem() {
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [showOrbits, setShowOrbits] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [isPaused, setIsPaused] = useState(false)
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0)

  const selectPlanet = useCallback((planet) => {
    setSelectedPlanet(planet)
  }, [])

  const deselectPlanet = useCallback(() => {
    setSelectedPlanet(null)
  }, [])

  return {
    selectedPlanet,
    showOrbits,
    showLabels,
    isPaused,
    speedMultiplier,
    selectPlanet,
    deselectPlanet,
    setShowOrbits,
    setShowLabels,
    setIsPaused,
    setSpeedMultiplier,
  }
}
