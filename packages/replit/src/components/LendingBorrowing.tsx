import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'
import TokenIcon from './TokenIcon'
import LiquidationExplainer from './LiquidationExplainer'
import { PROTOCOL_CONFIG, LENDING_CONFIG } from '../utils/constants'

const LendingBorrowing: React.FC = () => {
  const { 
    userLendingPosition, 
    protocolStats, 
    isLoading, 
    addCollateral, 
    withdrawCollateral, 
    borrowOracle, 
    repayOracle,
    liquidate,
    isConnected: contractConnected,
    initializeWeb3
  } = useContract()
  const { isConnected: walletConnected, balance, isInitializing, connect } = useWallet()
  
  const [activeTab, setActiveTab] = useState<'collateral' | 'borrow' | 'liquidate'>('collateral')
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'addCollateral' | 'withdrawCollateral' | 'borrowOracle' | 'repayOracle'>('addCollateral')
  const [liquidateAddress, setLiquidateAddress] = useState('')
  const [showLiquidationExplainer, setShowLiquidationExplainer] = useState(false)
  const [showLiquidationInfo, setShowLiquidationInfo] = useState(false)

  const isConnected = walletConnected && contractConnected

  // Initialize contracts when wallet connects
  useEffect(() => {
    if (walletConnected && !contractConnected) {
      initializeWeb3()
    }
  }, [walletConnected, contractConnected, initializeWeb3])

  const handleTransaction = async () => {
    if (!amount || !isConnected) return

    try {
      let result
      switch (action) {
        case 'addCollateral':
          result = await addCollateral(amount)
          break
        case 'withdrawCollateral':
          result = await withdrawCollateral(amount)
          break
        case 'borrowOracle':
          result = await borrowOracle(amount)
          break
        case 'repayOracle':
          result = await repayOracle(amount)
          break
        default:
          return
      }

      if (result && result.success) {
        setAmount('')
        // Use global notification system
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification('success', result.message, result.txHash)
        }
      } else {
        if (result && result.error && result.error.includes('rejected')) {
          if (typeof window !== 'undefined' && (window as any).showNotification) {
            (window as any).showNotification('rejected', 'Transaction was rejected by user')
          }
        } else {
          if (typeof window !== 'undefined' && (window as any).showNotification) {
            (window as any).showNotification('error', result?.error || 'Transaction failed')
          }
        }
      }
    } catch (error) {
      console.error('Transaction error:', error)
      if (typeof window !== 'undefined' && (window as any).showNotification) {
        (window as any).showNotification('error', 'Transaction failed. Please try again.')
      }
    }
  }

  const handleLiquidate = async () => {
    if (!liquidateAddress || !isConnected) return

    try {
      const result = await liquidate(liquidateAddress)
      
      if (result && result.success) {
        setLiquidateAddress('')
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification('success', result.message, result.txHash)
        }
      } else {
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification('error', result?.error || 'Liquidation failed')
        }
      }
    } catch (error) {
      console.error('Liquidation error:', error)
      if (typeof window !== 'undefined' && (window as any).showNotification) {
        (window as any).showNotification('error', 'Liquidation failed. Please try again.')
      }
    }
  }

  const formatAmount = (amount: string, decimals: number = 4) => {
    const num = parseFloat(amount)
    if (num === 0) return '0'
    if (num < 0.0001) return '<0.0001'
    return num.toFixed(decimals)
  }

  const formatHealthRatio = (ratio: number) => {
    if (ratio === 999 || ratio === 0) return '∞'
    return `${ratio.toFixed(1)}%`
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'safe': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'danger': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getHealthBgColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-900/20 border-green-500/30'
      case 'warning': return 'bg-yellow-900/20 border-yellow-500/30'
      case 'danger': return 'bg-red-900/20 border-red-500/30'
      default: return 'bg-gray-900/20 border-gray-500/30'
    }
  }

  const setPercentageAmount = (percentage: number) => {
    let maxAmount = 0
    
    switch (action) {
      case 'addCollateral':
        maxAmount = parseFloat(balance)
        break
      case 'withdrawCollateral':
        maxAmount = parseFloat(userLendingPosition.collateral) / 1e18
        break
      case 'borrowOracle':
        maxAmount = parseFloat(userLendingPosition.collateralValue) * 100 / PROTOCOL_CONFIG.collateralRatio / 1e18 - parseFloat(userLendingPosition.borrowed) / 1e18
        break
      case 'repayOracle':
        maxAmount = parseFloat(userLendingPosition.borrowed) / 1e18
        break
      default:
        maxAmount = 0
    }
    
    const targetAmount = (maxAmount * percentage / 100).toString()
    setAmount(targetAmount)
  }

  if (isInitializing) {
  return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Initializing...</div>
      </div>
    )
  }

  if (!walletConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-effect border border-gray-700/50 rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6 text-center">
            Please connect your wallet to interact with the Oracle Lend protocol
          </p>
          <button
            onClick={connect}
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all"
          >
            Connect Wallet
          </button>
        </div>
        </div>
    )
  }

  if (!contractConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-effect border border-gray-700/50 rounded-xl p-8 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">Connecting to Contracts</h2>
          <p className="text-gray-300 mb-6 text-center">
            Initializing contract connections...
          </p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              </div>
                </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-3 sm:mb-4">Oracle Lend Protocol</h1>
          <p className="text-gray-300 text-sm sm:text-base lg:text-lg px-4 sm:px-0">Over-collateralized lending with tTRUST collateral and ORACLE borrowing</p>
        </div>

        {/* Protocol Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="glass-effect border border-gray-700/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-white font-semibold mb-2">Available ORACLE</h3>
            <p className="text-xl sm:text-2xl font-bold text-purple-400">
              {formatAmount((parseFloat(protocolStats.oracleBalance) / 1e18).toString())}
            </p>
          </div>
          <div className="glass-effect border border-gray-700/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-white font-semibold mb-2">Current Price</h3>
            <p className="text-xl sm:text-2xl font-bold text-blue-400">
              {formatAmount((parseFloat(protocolStats.currentPrice) / 1e18).toString())} ORACLE/TTRUST
            </p>
          </div>
          <div className="glass-effect border border-gray-700/50 rounded-xl p-4 sm:p-6">
            <h3 className="text-white font-semibold mb-2">Collateral Ratio</h3>
            <p className="text-xl sm:text-2xl font-bold text-green-400">{PROTOCOL_CONFIG.collateralRatio}%</p>
                    </div>
                  </div>

        {/* User Position */}
        <div className={`glass-effect border border-gray-700/50 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 ${getHealthBgColor(userLendingPosition.status)}`}>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Your Position</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <TokenIcon token="tTRUST" className="w-5 h-5 mr-2" />
                TTRUST Collateral
              </h3>
              <p className="text-2xl font-bold text-blue-400">
                {formatAmount((parseFloat(userLendingPosition.collateral) / 1e18).toString())} TTRUST
              </p>
              <p className="text-sm text-gray-400">
                Value: {formatAmount((parseFloat(userLendingPosition.collateralValue) / 1e18).toString())} ORACLE
              </p>
                    </div>
                    <div>
              <h3 className="text-white font-semibold mb-2 flex items-center">
                <TokenIcon token="ORACLE" className="w-5 h-5 mr-2" />
                ORACLE Debt
              </h3>
              <p className="text-2xl font-bold text-red-400">
                {formatAmount((parseFloat(userLendingPosition.borrowed) / 1e18).toString())} ORACLE
              </p>
                    </div>
                    <div>
              <h3 className="text-white font-semibold mb-2">Health Ratio</h3>
              <p className={`text-2xl font-bold ${getHealthColor(userLendingPosition.status)}`}>
                {formatHealthRatio(userLendingPosition.healthRatio)}
              </p>
              <p className="text-sm text-gray-400 capitalize">{userLendingPosition.status}</p>
            </div>
            </div>
          </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Lending/Borrowing Interface */}
          <div className="glass-effect border border-gray-700/50 rounded-xl p-6">
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setActiveTab('collateral')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'collateral'
                    ? 'bg-blue-600 text-white'
                    : 'glass-effect text-gray-300 hover:border-gray-500/50 border border-gray-600/30'
                }`}
              >
                TTRUST Collateral
              </button>
              <button
                onClick={() => setActiveTab('borrow')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeTab === 'borrow'
                    ? 'bg-purple-600 text-white'
                    : 'glass-effect text-gray-300 hover:border-gray-500/50 border border-gray-600/30'
                }`}
              >
                ORACLE Borrowing
              </button>

            </div>

            {activeTab === 'collateral' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">TTRUST Collateral Management</h3>
                
                <div className="flex space-x-2 mb-4">
                        <button
                    onClick={() => setAction('addCollateral')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      action === 'addCollateral'
                        ? 'bg-green-600 text-white'
                        : 'glass-effect text-gray-300 border border-gray-600/30'
                    }`}
                  >
                    Add Collateral
                        </button>
                        <button
                    onClick={() => setAction('withdrawCollateral')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      action === 'withdrawCollateral'
                        ? 'bg-red-600 text-white'
                        : 'glass-effect text-gray-300 border border-gray-600/30'
                    }`}
                  >
                    Withdraw Collateral
                        </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (TTRUST)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || parseFloat(value) >= 0) {
                        setAmount(value)
                      }
                    }}
                    placeholder="0.0"
                    className="w-full px-4 py-3 glass-effect border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>Balance: {formatAmount(balance)} TTRUST</span>
                    {action === 'withdrawCollateral' && (
                      <span>Max: {formatAmount((parseFloat(userLendingPosition.collateral) / 1e18).toString())} TTRUST</span>
                    )}
                  </div>
                  
                  {/* Quick Amount Selectors */}
                  <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2 mt-3">
                    <button
                      onClick={() => setPercentageAmount(25)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => setPercentageAmount(50)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setPercentageAmount(75)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => setPercentageAmount(100)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                    <button
                  onClick={handleTransaction}
                  disabled={!isConnected || isLoading || !amount}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    !isConnected || isLoading || !amount
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : action === 'addCollateral'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {isLoading ? 'Processing...' : 
                   !isConnected ? 'Connect Wallet' : 
                   action === 'addCollateral' ? 'Add Collateral' : 'Withdraw Collateral'}
                    </button>
              </div>
            )}

            {activeTab === 'borrow' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">ORACLE Token Borrowing</h3>
                
                <div className="flex space-x-2 mb-4">
                    <button
                    onClick={() => setAction('borrowOracle')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      action === 'borrowOracle'
                        ? 'bg-purple-600 text-white'
                        : 'glass-effect text-gray-300 border border-gray-600/30'
                    }`}
                  >
                    Borrow ORACLE
                    </button>
                    <button
                    onClick={() => setAction('repayOracle')}
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      action === 'repayOracle'
                        ? 'bg-green-600 text-white'
                        : 'glass-effect text-gray-300 border border-gray-600/30'
                    }`}
                  >
                    Repay ORACLE
                    </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (ORACLE)
                  </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={amount}
                      onChange={(e) => {
                        const value = e.target.value
                        if (value === '' || parseFloat(value) >= 0) {
                          setAmount(value)
                        }
                      }}
                    placeholder="0.0"
                    className="w-full px-4 py-3 glass-effect border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    {action === 'borrowOracle' && (
                      <span>Max Borrow: {formatAmount((parseFloat(userLendingPosition.collateralValue) * 100 / PROTOCOL_CONFIG.collateralRatio / 1e18 - parseFloat(userLendingPosition.borrowed) / 1e18).toString())} ORACLE</span>
                    )}
                    {action === 'repayOracle' && (
                      <span>Debt: {formatAmount((parseFloat(userLendingPosition.borrowed) / 1e18).toString())} ORACLE</span>
                    )}
                  </div>
                  
                  {/* Quick Amount Selectors */}
                  <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2 mt-3">
                    <button
                      onClick={() => setPercentageAmount(25)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      25%
                    </button>
                    <button
                      onClick={() => setPercentageAmount(50)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      50%
                    </button>
                    <button
                      onClick={() => setPercentageAmount(75)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      75%
                    </button>
                    <button
                      onClick={() => setPercentageAmount(100)}
                      className="flex-1 py-2 px-3 glass-effect hover:border-gray-500/50 text-gray-300 text-sm font-medium rounded-lg transition-all border border-gray-600/30"
                      type="button"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleTransaction}
                  disabled={!isConnected || isLoading || !amount}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    !isConnected || isLoading || !amount
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : action === 'borrowOracle'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isLoading ? 'Processing...' : 
                   !isConnected ? 'Connect Wallet' : 
                   action === 'borrowOracle' ? 'Borrow ORACLE' : 'Repay ORACLE'}
                </button>
              </div>
            )}

            {activeTab === 'liquidate' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white">Liquidation Center</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Target User Address
                  </label>
                  <input
                    type="text"
                    value={liquidateAddress}
                    onChange={(e) => setLiquidateAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-3 glass-effect border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                  </div>

                <button
                  onClick={() => setShowLiquidationExplainer(true)}
                  disabled={!liquidateAddress}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    !liquidateAddress
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  🔍 Analyze Position
                </button>
              </div>
            )}
          </div>

          {/* Liquidation Interface */}
          <div className="glass-effect border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Liquidation</h3>
              <button
                onClick={() => setShowLiquidationInfo(!showLiquidationInfo)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all"
              >
                ℹ️ How it works
              </button>
            </div>
            
            {showLiquidationInfo && (
              <div className="space-y-4 mb-6">
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm">
                    <strong>💡 Liquidation Guide:</strong> 
                    <br />
                    <br />
                    <p>You need ORACLE tokens equal to the user's debt to liquidate their position. </p>
                    <br />
                    <p>You'll receive their TTRUST collateral + 10% bonus as reward.</p>
                  </p>
                </div>
                
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-300 font-semibold mb-2">⚠️ Important Notes:</h4>
                  <ul className="text-red-300 text-sm space-y-1 list-disc list-inside">
                    <li>Only positions with health ratio &lt; 120% can be liquidated</li>
                    <li>You must have enough ORACLE tokens to cover the user's debt</li>
                    <li>You'll receive the user's TTRUST collateral + 10% bonus</li>
                    <li>Use "Analyze Position" to check requirements before liquidating</li>
                  </ul>
                </div>
              </div>
            )}
            
            <p className="text-gray-300 text-sm mb-4">
              Liquidate unsafe positions to earn a {PROTOCOL_CONFIG.liquidationBonus}% bonus
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  User Address to Liquidate
                </label>
                <input
                  type="text"
                  value={liquidateAddress}
                  onChange={(e) => setLiquidateAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-4 py-3 glass-effect border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                </div>

                <button
                onClick={handleLiquidate}
                disabled={!isConnected || isLoading || !liquidateAddress}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  !isConnected || isLoading || !liquidateAddress
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isLoading ? 'Processing...' : 
                 !isConnected ? 'Connect Wallet' : 'Liquidate Position'}
                </button>
              </div>

            {/* Protocol Info */}
            <div className="mt-8 p-4 glass-effect rounded-lg">
              <h4 className="text-white font-semibold mb-2">Protocol Info</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Collateral Ratio Required: {PROTOCOL_CONFIG.collateralRatio}%</li>
                <li>• Liquidation Bonus: {PROTOCOL_CONFIG.liquidationBonus}%</li>
                <li>• Max LTV: {PROTOCOL_CONFIG.maxLTV.toFixed(2)}%</li>
                <li>• Price Oracle: DEX-based</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Liquidation Explainer Modal */}
      {showLiquidationExplainer && (
        <LiquidationExplainer
          targetUserAddress={liquidateAddress}
          onClose={() => setShowLiquidationExplainer(false)}
        />
      )}
    </div>
  )
}

export default LendingBorrowing