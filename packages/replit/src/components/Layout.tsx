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
    <div className="min-h-screen flex flex-col">
      <Navbar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isConnected={isConnected}
        account={account}
        connectWallet={connectWallet}
        disconnectWallet={disconnectWallet}
        isInitializing={isInitializing}
      />
      
      {isDashboard && (
        <div className="relative py-16 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-6xl font-bold mb-8 gradient-text tracking-wide">
              ORACLE LEND
            </h1>
            <p className="text-xl text-slate-100 max-w-3xl mx-auto font-normal">
              A decentralized finance protocol that revolutionizes lending, borrowing, and token swapping on Intuition testnet. Trust your Intuition.
            </p>
            <div className="absolute top-32 right-20 w-1 h-1 bg-purple-400 rounded-full star" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-40 right-1/3 w-1 h-1 bg-pink-400 rounded-full star" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>
      )}

      <main className="relative z-10 flex-1 max-w-7xl mx-auto px-4 pb-16">
        {children}
      </main>

      <footer className="relative z-10 py-8 mt-auto glass-effect">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-200">
          <p className="font-medium">&copy; 2025 ORACLE LEND. Built on Intuition Testnet.</p>
          <p className="text-sm mt-2 font-normal text-slate-300">
            Chain ID: 13579 | Native Token: tTRUST | Data Availability: Arbitrum AnyTrust
          </p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
