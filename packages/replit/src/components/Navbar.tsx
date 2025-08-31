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
  isInitializing?: boolean
}

const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  toggleTheme,
  isConnected,
  account,
  connectWallet,
  disconnectWallet,
  isInitializing
}) => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', path: '/', icon: 'fas fa-home' },
    { name: 'Lending & Borrowing', path: '/lending', icon: 'fas fa-coins' },
    { name: 'Swap', path: '/dex', icon: 'fas fa-exchange-alt' },
    { name: 'Analytics', path: '/analytics', icon: 'fas fa-chart-line' }
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path
  }

  return (
    <>
    <nav className="relative z-50 glass-effect border-b border-gray-700/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Faucet Link */}
          <div className="flex items-center space-x-4">
            <a
              href="https://testnet.hub.intuition.systems/"
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
            <Link to="/" className="flex items-center space-x-3">
              <img 
                src="/oracle-lend-logo.png" 
                alt="Oracle Lend Logo" 
                className="w-10 h-10 object-contain rounded-lg"
              />
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
              isInitializing={isInitializing}
            />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px] flex items-center justify-center transition-transform duration-200"
            >
              <div className="relative w-6 h-5 flex flex-col justify-between">
                <span className={`block h-0.5 w-full bg-current transform transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-current transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-current transform transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Mobile Navigation Overlay - Outside nav for proper z-index */}
    <div className={`fixed inset-0 z-[9999] bg-black/95 backdrop-blur-lg transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <img 
                  src="/oracle-lend-logo.png" 
                  alt="Oracle Lend Logo" 
                  className="w-8 h-8 object-contain rounded-lg"
                />
                <span className="text-lg font-bold gradient-text">ORACLE LEND</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 min-h-[44px] min-w-[44px]"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            {/* Mobile Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
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
                  href="https://testnet.hub.intuition.systems/"
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
            
            {/* Mobile Footer */}
            <div className="p-4 border-t border-gray-700/50">
              <div className="flex items-center justify-between">
                <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
                <div className="text-xs text-gray-500">v1.0.0</div>
              </div>
            </div>
          </div>
        </div>
    </>
  )
}

export default Navbar
