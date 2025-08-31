import React from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'

interface LayoutProps {
  children: React.ReactNode
  isDarkMode: boolean
  toggleTheme: () => void
  isConnected: boolean
  account: string | null
  connectWallet: () => void
  disconnectWallet: () => void
  isInitializing?: boolean
}

const Layout: React.FC<LayoutProps> = ({
  children,
  isDarkMode,
  toggleTheme,
  isConnected,
  account,
  connectWallet,
  disconnectWallet,
  isInitializing
}) => {
  const location = useLocation()
  const isDashboard = location.pathname === '/'

  return (
    <div className="min-h-screen layout-container">
      <Navbar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isConnected={isConnected}
        account={account}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        isInitializing={isInitializing}
      />
      
      {/* Hero Section - Only show on Dashboard */}
      {isDashboard && (
        <div className="relative py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-4 gradient-text">
              ORACLE LEND
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              A decentralized finance protocol that revolutionizes lending, borrowing, and token swapping on Intuition testnet. Trust your Intuition.
            </p>
            
            {/* Floating cosmic elements */}
            <div className="absolute top-10 left-10 w-2 h-2 bg-blue-400 rounded-full animate-twinkle"></div>
            <div className="absolute top-32 right-20 w-1 h-1 bg-purple-400 rounded-full animate-twinkle" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-20 left-1/4 w-3 h-3 bg-yellow-400 rounded-full animate-golden-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-40 right-1/3 w-1 h-1 bg-pink-400 rounded-full animate-mythic-sparkle" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 pb-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-700/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400">
          <p>&copy; 2025 ORACLE LEND. Built on Intuition Testnet.</p>
          <p className="text-sm mt-2">
            Chain ID: 13579 | Native Token: tTRUST | Data Availability: Arbitrum AnyTrust
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
