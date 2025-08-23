import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import LendingBorrowing from './components/LendingBorrowing'
import Swap from './components/DEX'
import Analytics from './components/Analytics'
import { useWallet } from './hooks/useWallet'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const { isConnected, account, connect, disconnect } = useWallet()
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
    <div className={`min-h-screen cosmic-bg ${isDarkMode ? 'dark' : ''}`}>
      {/* Global Transaction Notification */}
      {notification && (
        <div 
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-md w-auto mx-4 p-4 rounded-lg border shadow-2xl ${
            notification.type === 'success' 
              ? 'bg-green-900/95 border-green-500/50 text-green-100' 
              : notification.type === 'rejected'
              ? 'bg-yellow-900/95 border-yellow-500/50 text-yellow-100'
              : 'bg-red-900/95 border-red-500/50 text-red-100'
          } backdrop-blur-sm`}
          style={{ 
            position: 'fixed', 
            top: '1rem', 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 999999 
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
              ) : notification.type === 'rejected' ? (
                <i className="fas fa-times-circle text-yellow-400 text-xl"></i>
              ) : (
                <i className="fas fa-exclamation-circle text-red-400 text-xl"></i>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-1">
                {notification.type === 'success' ? 'Transaction Successful!' : 
                 notification.type === 'rejected' ? 'Transaction Rejected' : 'Transaction Failed'}
              </h4>
              <p className="text-sm opacity-90">{notification.message}</p>
              {notification.txHash && (
                <p className="text-xs mt-2 opacity-70">
                  Tx: {notification.txHash.slice(0, 10)}...{notification.txHash.slice(-8)}
                </p>
              )}
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="flex-shrink-0 text-gray-400 hover:text-white"
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
  )
}

export default App
