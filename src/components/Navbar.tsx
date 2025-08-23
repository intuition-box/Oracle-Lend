import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import WalletConnect from './WalletConnect'
import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  isDarkMode: boolean
  toggleTheme: () => void
  isConnected: boolean
  account: string | null
  connectWallet: () => void
  disconnectWallet: () => void
}

const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  toggleTheme,
  isConnected,
  account,
  connectWallet,
  disconnectWallet
}) => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', path: '/', icon: 'fas fa-home' },
    { name: 'Lending', path: '/lending', icon: 'fas fa-coins' },
    { name: 'Swap', path: '/dex', icon: 'fas fa-exchange-alt' },
    { name: 'Analytics', path: '/analytics', icon: 'fas fa-chart-line' }
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className="relative z-50 glass-effect border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Faucet Link */}
          <div className="flex items-center space-x-4">
            <a
              href="https://faucet.intuition.systems"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-all duration-200"
            >
              <i className="fas fa-faucet text-blue-400"></i>
              <span className="text-sm font-medium text-blue-300">Faucet</span>
            </a>
          </div>

          {/* Center - Logo and Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <i className="fas fa-atom text-white text-sm"></i>
              </div>
              <span className="text-xl font-bold gradient-text">ORACLE LEND</span>
            </Link>

            <div className="flex items-center space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <i className={`${item.icon} text-sm`}></i>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Theme Toggle and Wallet */}
          <div className="flex items-center space-x-4">
            <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            <WalletConnect
              isConnected={isConnected}
              account={account}
              connectWallet={connectWallet}
              disconnectWallet={disconnectWallet}
            />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10"
            >
              <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700/50">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActivePath(item.path)
                      ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <i className={`${item.icon} text-sm`}></i>
                  <span className="font-medium">{item.name}</span>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-gray-700/50">
                <a
                  href="https://faucet.intuition.systems"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-300"
                >
                  <i className="fas fa-faucet text-sm"></i>
                  <span className="font-medium">Get Test Tokens</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
