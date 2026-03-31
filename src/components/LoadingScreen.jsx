import { useEffect, useState } from 'react'

const LINES = [
  'INITIALIZING HELIOSCOPE v2.0.1',
  'LOADING STELLAR TEXTURES ...',
  'CALIBRATING KEPLERIAN ORBITS ...',
  'SPINNING UP SHADER PIPELINE ...',
  'ENGAGING WARP DRIVE ...',
  'SYSTEM READY',
]

export default function LoadingScreen({ progress = 0 }) {
  const [visibleLines, setVisibleLines] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const id = setInterval(() => {
      setVisibleLines((v) => Math.min(v + 1, LINES.length))
    }, 320)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: '#000005',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Share Tech Mono, monospace',
        color: '#00ffcc',
      }}
    >
      {/* Animated ring */}
      <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '40px' }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#00ffcc22"
            strokeWidth="2"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="#00ffcc"
            strokeWidth="2"
            strokeDasharray={`${339.3 * progress / 100} 339.3`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            style={{ transition: 'stroke-dasharray 0.3s ease', filter: 'drop-shadow(0 0 6px #00ffcc)' }}
          />
          <circle
            cx="60" cy="60" r="38"
            fill="none"
            stroke="#00ffcc11"
            strokeWidth="1"
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1, fontFamily: 'Orbitron, sans-serif', letterSpacing: '0.1em' }}>
            {Math.round(progress)}
          </div>
          <div style={{ fontSize: '10px', color: '#00ffcc88', letterSpacing: '0.2em' }}>%</div>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '26px',
          fontWeight: 900,
          letterSpacing: '0.3em',
          textShadow: '0 0 30px #00ffcc',
          marginBottom: '8px',
        }}
      >
        HELIOSCOPE
      </div>
      <div style={{ fontSize: '9px', color: '#00ffcc55', letterSpacing: '0.5em', marginBottom: '40px' }}>
        SOLAR SYSTEM SIMULATION
      </div>

      {/* Boot log */}
      <div
        style={{
          width: '360px',
          height: '140px',
          border: '1px solid #00ffcc22',
          borderRadius: '4px',
          padding: '12px 16px',
          background: 'rgba(0,255,204,0.02)',
          overflow: 'hidden',
        }}
      >
        {LINES.slice(0, visibleLines).map((line, i) => (
          <div
            key={i}
            style={{
              fontSize: '11px',
              color: i === visibleLines - 1 ? '#00ffcc' : '#00ffcc66',
              letterSpacing: '0.08em',
              marginBottom: '4px',
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <span style={{ color: '#00ffcc44' }}>&gt; </span>
            {line}
            {i === visibleLines - 1 && i < LINES.length - 1 && (
              <span style={{ color: '#00ffcc88' }}>{dots}</span>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
