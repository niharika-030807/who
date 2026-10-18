import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('⚠️ Critical UI Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="app">
          <div className="screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
            <div className="phase-header">
              <span className="phase-tag danger">SYSTEM NOTICE</span>
              <h2>Game Glitch Detected</h2>
            </div>

            <div
              style={{
                background: 'rgba(7, 15, 33, 0.92)',
                border: '1px solid #00f3ff',
                borderRadius: '12px',
                padding: '24px',
                maxWidth: '460px',
                margin: '20px auto',
                boxShadow: '0 0 30px rgba(0, 243, 255, 0.3)'
              }}
            >
              <p style={{ color: '#ffffff', fontSize: '15px', lineHeight: 1.6, marginBottom: '14px' }}>
                A minor visual sync error occurred. Your game session is still intact on the server.
              </p>
              {this.state.error && (
                <p
                  style={{
                    color: '#00f3ff',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    wordBreak: 'break-all'
                  }}
                >
                  {String(this.state.error.message || this.state.error)}
                </p>
              )}
              <button
                className="btn btn-primary btn-large"
                style={{ width: '100%', marginTop: '16px' }}
                onClick={this.handleReload}
              >
                🔄 Reconnect / Reload Game
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
