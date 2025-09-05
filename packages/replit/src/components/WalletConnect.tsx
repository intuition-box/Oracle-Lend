import React, { useState } from 'react'

interface WalletConnectProps {
  isConnected: boolean
  account: string | null
  connectWallet: () => void
  disconnectWallet: () => void
  isInitializing?: boolean
}

const WalletConnect: React.FC<WalletConnectProps> = ({
  isConnected,
  account,
  connectWallet,
  disconnectWallet,
  isInitializing = false
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <button
        disabled
        className="flex items-center space-x-2 px-4 py-2 bg-gray-600/50 text-gray-400 rounded-lg cursor-not-allowed"
      >
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="font-medium">Checking...</span>
      </button>
    )
  }

  if (!isConnected) {
    return (
      <button
        onClick={connectWallet}
        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
      >
        <i className="fas fa-wallet"></i>
        <span className="font-medium">Connect Wallet</span>
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 px-4 py-2 glass-effect border border-green-500/30 text-green-300 rounded-lg transition-all duration-200 hover:bg-green-500/10"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="font-medium">{formatAddress(account!)}</span>
        <i className={`fas fa-chevron-${isDropdownOpen ? 'up' : 'down'} text-xs`}></i>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-64 glass-effect border border-gray-600/50 rounded-lg shadow-xl z-[60]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">Connected Wallet</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-green-400">Active</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-sm font-mono">{formatAddress(account!)}</span>
              <button
                onClick={() => copyToClipboard(account!)}
                className="p-1 hover:bg-gray-700/50 rounded transition-colors"
                title="Copy address"
              >
                <i className="fas fa-copy text-gray-400 text-xs"></i>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Network:</span>
                <span className="text-green-400">Intuition Testnet</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Chain ID:</span>
                <span className="text-white">13579</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <button
                onClick={() => {
                  disconnectWallet()
                  setIsDropdownOpen(false)
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-300 rounded-lg hover:bg-red-600/30 transition-all duration-200"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </div>
  )
}

export default WalletConnect
