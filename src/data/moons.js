/**
 * Moon data keyed by parent planet id.
 * orbitRadius is in planet-local units.
 * orbitalSpeed is relative (Moon = 1.0 baseline).
 */
export const MOONS_DATA = {
  earth: [
    { id: 'moon', name: 'Moon', radius: 0.20, orbitRadius: 1.9, orbitalSpeed: 1.0,
      color: '#b0aeaa', emissiveColor: '#444' },
  ],

  mars: [
    { id: 'phobos', name: 'Phobos', radius: 0.06, orbitRadius: 0.82, orbitalSpeed: 9.5,
      color: '#887060', emissiveColor: '#332820' },
    { id: 'deimos', name: 'Deimos', radius: 0.05, orbitRadius: 1.3,  orbitalSpeed: 3.8,
      color: '#998070', emissiveColor: '#332820' },
  ],

  // Galilean moons — visually spaced beyond Jupiter's radius (2.8)
  jupiter: [
    { id: 'io',       name: 'Io',       radius: 0.20, orbitRadius: 4.2,  orbitalSpeed: 4.2,
      color: '#d4a843', emissiveColor: '#6b4a10' },
    { id: 'europa',   name: 'Europa',   radius: 0.17, orbitRadius: 5.9,  orbitalSpeed: 2.1,
      color: '#c8b89a', emissiveColor: '#555040' },
    { id: 'ganymede', name: 'Ganymede', radius: 0.25, orbitRadius: 8.4,  orbitalSpeed: 1.05,
      color: '#8a7a6a', emissiveColor: '#302820' },
    { id: 'callisto', name: 'Callisto', radius: 0.23, orbitRadius: 12.0, orbitalSpeed: 0.46,
      color: '#5a5048', emissiveColor: '#201a18' },
  ],

  // Saturn moons — all beyond ring outer edge (5.5)
  saturn: [
    { id: 'tethys', name: 'Tethys', radius: 0.09, orbitRadius: 6.5,  orbitalSpeed: 3.5,
      color: '#d0ccc0', emissiveColor: '#444040' },
    { id: 'dione',  name: 'Dione',  radius: 0.10, orbitRadius: 7.8,  orbitalSpeed: 2.5,
      color: '#c8c4b8', emissiveColor: '#404040' },
    { id: 'rhea',   name: 'Rhea',   radius: 0.12, orbitRadius: 9.5,  orbitalSpeed: 1.8,
      color: '#bfbbb0', emissiveColor: '#404040' },
    { id: 'titan',  name: 'Titan',  radius: 0.24, orbitRadius: 14.0, orbitalSpeed: 0.70,
      color: '#d4853a', emissiveColor: '#6b3a10' },
  ],
}
