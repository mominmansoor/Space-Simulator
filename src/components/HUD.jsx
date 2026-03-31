import { useEffect, useState } from 'react'

function ToggleSwitch({ label, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 w-full text-left group"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      <div
        style={{
          width: '34px',
          height: '18px',
          borderRadius: '9px',
          border: `1px solid ${value ? 'var(--color-accent)' : 'var(--color-text-dim)'}`,
          background: value ? 'var(--color-accent-dim)' : 'transparent',
          position: 'relative',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '2px',
            left: value ? '16px' : '2px',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: value ? 'var(--color-accent)' : 'var(--color-text-dim)',
            transition: 'all 0.2s',
            boxShadow: value ? '0 0 6px var(--color-accent)' : 'none',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          color: value ? 'var(--color-text)' : 'var(--color-text-dim)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </button>
  )
}

function ScanLine() {
  return (
    <div
      style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--color-accent), transparent)',
        opacity: 0.4,
        margin: '10px 0',
      }}
    />
  )
}

function SpeedControl({ value, onChange }) {
  const presets = [0.25, 0.5, 1, 2, 5]
  return (
    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
      {presets.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            flex: 1,
            padding: '3px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            border: `1px solid ${value === p ? 'var(--color-accent)' : 'var(--color-border)'}`,
            background: value === p ? 'var(--color-accent-dim)' : 'transparent',
            color: value === p ? 'var(--color-accent)' : 'var(--color-text-dim)',
            cursor: 'pointer',
            borderRadius: '2px',
            boxShadow: value === p ? '0 0 6px var(--color-accent-dim)' : 'none',
            transition: 'all 0.15s',
            letterSpacing: '0.05em',
          }}
        >
          {p}×
        </button>
      ))}
    </div>
  )
}

export default function HUD({
  selectedPlanet,
  showOrbits,
  showLabels,
  isPaused,
  speedMultiplier,
  onToggleOrbits,
  onToggleLabels,
  onTogglePause,
  onSpeedChange,
  onDeselect,
  sunDistance,
}) {
  const [time, setTime] = useState('')
  const [blinkOn, setBlinkOn] = useState(true)

  // Real-time clock
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date()
      setTime(
        now.toUTCString().replace('GMT', 'UTC').toUpperCase()
      )
      setBlinkOn(b => !b)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      {/* ─── TOP LEFT: Mission Header ─── */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 100,
          fontFamily: 'var(--font-display)',
          color: 'var(--color-accent)',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          textShadow: '0 0 20px var(--color-accent)',
          userSelect: 'none',
        }}
      >
        <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>
          HELIO<span style={{ color: '#ffffff66' }}>SCOPE</span>
        </div>
        <div style={{ fontSize: '9px', color: 'var(--color-text-dim)', letterSpacing: '0.4em', marginTop: '3px' }}>
          SOLAR SYSTEM — 3D SIMULATION
        </div>
      </div>

      {/* ─── TOP RIGHT: Clock ─── */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 100,
          fontFamily: 'var(--font-mono)',
          fontSize: '10px',
          color: 'var(--color-text-dim)',
          letterSpacing: '0.1em',
          textAlign: 'right',
          userSelect: 'none',
        }}
      >
        <div style={{ color: 'var(--color-text-dim)', marginBottom: '3px' }}>
          SYS_CLOCK
        </div>
        <div style={{ color: 'var(--color-text)', fontSize: '11px' }}>
          {time}
        </div>
        <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: blinkOn ? 'var(--color-accent)' : 'transparent',
              display: 'inline-block',
              boxShadow: blinkOn ? '0 0 6px var(--color-accent)' : 'none',
            }}
          />
          <span style={{ fontSize: '9px', letterSpacing: '0.2em' }}>
            {isPaused ? 'PAUSED' : 'LIVE'}
          </span>
        </div>
      </div>

      {/* ─── BOTTOM LEFT: Controls Panel ─── */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          zIndex: 100,
          minWidth: '210px',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '14px 16px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 30px rgba(0,255,204,0.06)',
          userSelect: 'none',
        }}
      >
        {/* Header bar */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-dim)',
            letterSpacing: '0.3em',
            marginBottom: '10px',
          }}
        >
          ◈ CTRL_PANEL
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <ToggleSwitch label="Orbit Rings" value={showOrbits} onChange={onToggleOrbits} />
          <ToggleSwitch label="Planet Labels" value={showLabels} onChange={onToggleLabels} />
        </div>

        <ScanLine />

        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            color: 'var(--color-text-dim)',
            letterSpacing: '0.2em',
            marginBottom: '4px',
          }}
        >
          SIM SPEED
        </div>
        <SpeedControl value={speedMultiplier} onChange={onSpeedChange} />

        <ScanLine />

        <button
          onClick={onTogglePause}
          style={{
            width: '100%',
            padding: '6px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            border: `1px solid ${isPaused ? '#ff6633' : 'var(--color-accent)'}`,
            background: isPaused ? 'rgba(255,100,50,0.12)' : 'var(--color-accent-dim)',
            color: isPaused ? '#ff9977' : 'var(--color-accent)',
            cursor: 'pointer',
            borderRadius: '2px',
            boxShadow: `0 0 10px ${isPaused ? 'rgba(255,100,50,0.15)' : 'var(--color-accent-dim)'}`,
            transition: 'all 0.2s',
          }}
        >
          {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
        </button>
      </div>

      {/* ─── BOTTOM RIGHT: Planet Info Panel ─── */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 100,
          minWidth: '260px',
          maxWidth: '300px',
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: '4px',
          padding: '14px 16px',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 0 30px rgba(0,255,204,0.06), ${selectedPlanet ? `0 0 20px ${selectedPlanet.color}22` : ''}`,
          transition: 'box-shadow 0.4s',
          userSelect: 'none',
        }}
      >
        {/* Panel header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '9px',
              color: 'var(--color-text-dim)',
              letterSpacing: '0.3em',
            }}
          >
            ◈ TARGET_DATA
          </div>
          {selectedPlanet && (
            <button
              onClick={onDeselect}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '9px',
                color: 'var(--color-text-dim)',
                background: 'none',
                border: '1px solid var(--color-border)',
                borderRadius: '2px',
                padding: '2px 6px',
                cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              ✕ SPACE
            </button>
          )}
        </div>

        {selectedPlanet ? (
          <>
            {/* Planet name */}
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 700,
                color: selectedPlanet.color,
                textShadow: `0 0 20px ${selectedPlanet.color}`,
                letterSpacing: '0.15em',
                marginBottom: '12px',
              }}
            >
              {selectedPlanet.name.toUpperCase()}
            </div>

            {/* Data rows */}
            {[
              { label: 'DIST FROM SUN', value: `${sunDistance?.toFixed(2) ?? '--'} AU` },
              { label: 'REAL DIST (AU)', value: `${selectedPlanet.distanceAU} AU` },
              { label: 'ORB SPEED', value: `${selectedPlanet.orbitalSpeed.toFixed(3)}× Earth` },
              { label: 'ROT SPEED', value: selectedPlanet.rotationSpeed < 0 ? 'RETROGRADE' : `${Math.abs(selectedPlanet.rotationSpeed).toFixed(3)}×` },
              { label: 'AXIAL TILT', value: `${selectedPlanet.tilt ?? 0}°` },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  marginBottom: '6px',
                  gap: '12px',
                }}
              >
                <span style={{ color: 'var(--color-text-dim)', letterSpacing: '0.08em' }}>{label}</span>
                <span style={{ color: 'var(--color-text)', textAlign: 'right', letterSpacing: '0.08em' }}>{value}</span>
              </div>
            ))}

            <ScanLine />

            {/* Description */}
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--color-text-dim)',
                lineHeight: '1.6',
                letterSpacing: '0.04em',
              }}
            >
              {selectedPlanet.description}
            </div>
          </>
        ) : (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--color-text-dim)',
              letterSpacing: '0.1em',
              lineHeight: '1.8',
            }}
          >
            <div style={{ marginBottom: '8px', color: 'var(--color-text)' }}>
              NO TARGET SELECTED
            </div>
            <div>› CLICK A PLANET TO FOLLOW</div>
            <div>› SPACE TO RELEASE LOCK</div>
            <div style={{ marginTop: '8px', opacity: 0.6, fontSize: '10px' }}>
              DRAG TO ORBIT VIEW<br />
              SCROLL TO ZOOM
            </div>
          </div>
        )}
      </div>

    </>
  )
}
