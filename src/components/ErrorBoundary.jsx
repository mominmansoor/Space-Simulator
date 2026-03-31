import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          position: 'fixed', inset: 0, background: '#000010',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', fontFamily: 'monospace', color: '#ff4444',
          padding: '40px', zIndex: 9999,
        }}>
          <div style={{ fontSize: '14px', letterSpacing: '0.2em', marginBottom: '16px' }}>
            ◈ RENDER ERROR
          </div>
          <pre style={{
            background: '#0a0010', border: '1px solid #ff444433', borderRadius: '4px',
            padding: '16px', fontSize: '11px', maxWidth: '700px', overflowX: 'auto',
            color: '#ff8888', lineHeight: 1.6,
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack?.split('\n').slice(0, 8).join('\n')}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
