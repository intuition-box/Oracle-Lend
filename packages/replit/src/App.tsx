import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import LendingBorrowing from './components/LendingBorrowing'
import Swap from './components/DEX'
import Analytics from './components/Analytics'
import AnimatedBackground from './components/AnimatedBackground'
import { useWallet } from './hooks/useWallet'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const { isConnected, account, connect, disconnect, isInitializing } = useWallet()
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error' | 'rejected'
    message: string
    txHash?: string
  } | null>(null)

  useEffect(() => {
    // Apply dark mode class to html element
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  // Global notification system
  const showNotification = (type: 'success' | 'error' | 'rejected', message: string, txHash?: string) => {
    setNotification({ show: true, type, message, txHash })
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setNotification(null)
    }, 5000)
  }

  // Make notification function available globally
  React.useEffect(() => {
    (window as any).showNotification = showNotification
  }, [])

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Animated Background - Will be at z-index: -1 */}
      <AnimatedBackground />
      
      {/* Main Content Container - Creates new stacking context */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh" }} className={isDarkMode ? 'dark' : ''}>
        {/* Global Transaction Notification */}
        {notification && (
          <div 
            style={{ 
              position: 'fixed', 
              top: '20px', 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 9999,
              width: 'auto',
              maxWidth: '400px',
              padding: '16px',
              borderRadius: '12px',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: notification.type === 'success' 
                ? '1px solid rgba(34, 197, 94, 0.5)' 
                : notification.type === 'rejected'
                ? '1px solid rgba(245, 158, 11, 0.5)'
                : '1px solid rgba(239, 68, 68, 0.5)',
              backgroundColor: notification.type === 'success' 
                ? 'rgba(21, 128, 61, 0.95)' 
                : notification.type === 'rejected'
                ? 'rgba(146, 64, 14, 0.95)'
                : 'rgba(127, 29, 29, 0.95)',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flexShrink: 0 }}>
                {notification.type === 'success' ? (
                  <i className="fas fa-check-circle" style={{ color: '#4ade80', fontSize: '20px' }}></i>
                ) : notification.type === 'rejected' ? (
                  <i className="fas fa-times-circle" style={{ color: '#fbbf24', fontSize: '20px' }}></i>
                ) : (
                  <i className="fas fa-exclamation-circle" style={{ color: '#f87171', fontSize: '20px' }}></i>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '14px' }}>
                  {notification.type === 'success' ? 'Transaction Successful!' : 
                   notification.type === 'rejected' ? 'Transaction Rejected' : 'Transaction Failed'}
                </h4>
                <p style={{ fontSize: '13px', opacity: 0.9, margin: 0 }}>{notification.message}</p>
                {notification.txHash && (
                  <p style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7, margin: '8px 0 0 0' }}>
                    Tx: {notification.txHash.slice(0, 10)}...{notification.txHash.slice(-8)}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setNotification(null)}
                style={{ 
                  flexShrink: 0, 
                  color: '#9ca3af', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '4px'
                }}
                onMouseOver={(e) => (e.target as HTMLElement).style.color = '#ffffff'}
                onMouseOut={(e) => (e.target as HTMLElement).style.color = '#9ca3af'}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
        
        <Router>
          <Layout 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            isConnected={isConnected}
            account={account}
            connectWallet={connect}
            disconnectWallet={disconnect}
            isInitializing={isInitializing}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lending" element={<LendingBorrowing />} />
              <Route path="/dex" element={<Swap />} />
              <Route path="/analytics" element={<Analytics />} />
            </Routes>
          </Layout>
        </Router>
      </div>
    </div>
  )
}

export default App
