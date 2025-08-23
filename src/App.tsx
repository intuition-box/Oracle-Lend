import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import LendingBorrowing from './components/LendingBorrowing'
import DEX from './components/DEX'
import Analytics from './components/Analytics'
import { useWallet } from './hooks/useWallet'

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const { isConnected, account, connect, disconnect } = useWallet()

  useEffect(() => {
    // Apply dark mode class to html element
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className={`min-h-screen cosmic-bg ${isDarkMode ? 'dark' : ''}`}>
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
            <Route path="/dex" element={<DEX />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Layout>
      </Router>
    </div>
  )
}

export default App
