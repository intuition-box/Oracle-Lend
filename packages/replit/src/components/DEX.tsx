import React, { useState, useEffect, useCallback } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'
import { SwapQuote } from '../types'
import { trackTransaction, initializeAnalytics } from '../utils/analyticsTracker'
import TokenIcon from './TokenIcon'
import { ethers } from 'ethers'

import { INTUITION_TESTNET } from '../utils/constants'

// Contract addresses from deployment
const CONTRACTS = {
  DEX: INTUITION_TESTNET.contracts.dex,
  OracleToken: INTUITION_TESTNET.contracts.oracleToken
}

// AMM DEX Contract ABI - functions for the new AMM
const DEX_ABI = [
  'function swapTrustForOracle(uint256 _amountIn, uint256 _minAmountOut) external payable',
  'function swapOracleForTrust(uint256 _amountIn, uint256 _minAmountOut) external',
  'function getAmountOut(address _tokenIn, uint256 _amountIn) external view returns (uint256 amountOut)',
  'function getPrice(address _token) external view returns (uint256 price)',
  'function getDEXStats() external view returns (uint256 _tTrustReserve, uint256 _oracleReserve, uint256 _totalVolume, uint256 _totalTrades, uint256 _totalLiquidity)',
  'function getAnalytics() external view returns (uint256 _totalVolume, uint256 _totalTrades, uint256 _volume24h, uint256 _trades24h, uint256 _uniqueTraders, uint256 _totalFeesCollected, uint256 _tTrustReserve, uint256 _oracleReserve)',
  'function tTrustReserve() external view returns (uint256)',
  'function oracleReserve() external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function FEE_RATE() external view returns (uint256)'
]

// Oracle Token ABI - minimal functions needed
const ORACLE_TOKEN_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)'
]

const DEX: React.FC = () => {
  const { isLoading: contractLoading } = useContract()
  const { isConnected, account, balance, isInitializing } = useWallet()
  
  const [fromToken, setFromToken] = useState<'TTRUST' | 'ORACLE'>('TTRUST')
  const [toToken, setToToken] = useState<'TTRUST' | 'ORACLE'>('ORACLE')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [balances, setBalances] = useState({ TTRUST: '0', ORACLE: '0' })
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [slippage, setSlippage] = useState(0.5) // Default 0.5% (min: 0.1%, max: 10% for security)
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dexStats, setDexStats] = useState({ 
    ethReserve: '0', 
    oracleReserve: '0', 
    totalVolume: '0', 
    totalTrades: '0', 
    totalLiquidity: '0',
    currentPrice: 0 // Dynamic price: 1 TTRUST = X ORACLE
  })
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)

  // Check if user is on correct network
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) return false
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const network = await provider.getNetwork()
      const isCorrect = Number(network.chainId) === INTUITION_TESTNET.chainId
      setIsCorrectNetwork(isCorrect)
      return isCorrect
    } catch (error) {
      console.error('Failed to check network:', error)
      setIsCorrectNetwork(false)
      return false
    }
  }, [])

  // Switch to Intuition Testnet
  const switchToIntuitionTestnet = async () => {
    if (!window.ethereum) return
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${INTUITION_TESTNET.chainId.toString(16)}` }],
      })
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${INTUITION_TESTNET.chainId.toString(16)}`,
              chainName: INTUITION_TESTNET.name,
              nativeCurrency: INTUITION_TESTNET.nativeCurrency,
              rpcUrls: [INTUITION_TESTNET.rpcUrl],
              blockExplorerUrls: [INTUITION_TESTNET.blockExplorer],
            }],
          })
        } catch (addError) {
          console.error('Failed to add network:', addError)
        }
      } else {
        console.error('Failed to switch network:', switchError)
      }
    }
  }

  // Fetch real balances and DEX stats
  const fetchBalances = async () => {
    if (!isConnected || !account || !window.ethereum || !isCorrectNetwork) {
      // Production: Remove console.log
      // console.log('fetchBalances: Prerequisites not met', { 
      //   isConnected, 
      //   account: account ? 'present' : 'missing', 
      //   hasEthereum: !!window.ethereum, 
      //   isCorrectNetwork 
      // })
      return
    }
    
    // Production: Remove console.log
    // console.log('fetchBalances: Fetching balances for account:', account)
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      
      // Get native token balance (TTRUST on Intuition Testnet)
      const nativeBalance = await provider.getBalance(account)
      // Production: Remove console.log
      // console.log('fetchBalances: Native balance raw:', nativeBalance.toString())
      
      // Get ORACLE ERC20 token balance
      const oracleContract = new ethers.Contract(CONTRACTS.OracleToken, ORACLE_TOKEN_ABI, provider)
      const oracleBalance = await oracleContract.balanceOf(account)
      // Production: Remove console.log
      // console.log('fetchBalances: Oracle balance raw:', oracleBalance.toString())
      
      const formattedBalances = {
        TTRUST: ethers.formatEther(nativeBalance), // Native token balance
        ORACLE: ethers.formatEther(oracleBalance)  // ERC20 token balance
      }
      
      // Production: Remove console.log
      // console.log('fetchBalances: Setting formatted balances:', formattedBalances)
      setBalances(formattedBalances)
    } catch (error) {
      console.error('Failed to fetch balances:', error)
    }
  }

  // Fetch AMM DEX stats
  const fetchDexStats = async () => {
    if (!window.ethereum) return
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const dexContract = new ethers.Contract(CONTRACTS.DEX, DEX_ABI, provider)
      
      // Get AMM stats
      const [tTrustReserve, oracleReserve, totalVolume, totalTrades, totalLiquidity] = await dexContract.getDEXStats()
      
      // Calculate current market price (1 TTRUST = X ORACLE)
      let currentPrice = 0
      const tTrustAmount = Number(ethers.formatEther(tTrustReserve))
      const oracleAmount = Number(ethers.formatEther(oracleReserve))
      
      if (tTrustAmount > 0 && oracleAmount > 0) {
        currentPrice = oracleAmount / tTrustAmount
      }
      
      setDexStats({
        ethReserve: ethers.formatEther(tTrustReserve),
        oracleReserve: ethers.formatEther(oracleReserve),
        totalVolume: ethers.formatEther(totalVolume),
        totalTrades: totalTrades.toString(),
        totalLiquidity: ethers.formatEther(totalLiquidity),
        currentPrice: currentPrice
      })
    } catch (error) {
      console.error('Failed to fetch AMM DEX stats:', error)
    }
  }

  // Initialize analytics and fetch data when wallet connects
  useEffect(() => {
    // Initialize analytics tracking
    try {
      initializeAnalytics()
    } catch (error) {
      console.error('Failed to initialize analytics:', error)
    }
    
    if (isConnected && account) {
      // Small delay to ensure wallet connection is fully established
      setTimeout(() => {
        checkNetwork().then(isCorrect => {
          if (isCorrect) {
            fetchBalances()
            fetchDexStats()
          }
        })
      }, 100)
    } else {
      setBalances({ TTRUST: '0', ORACLE: '0' })
      setIsCorrectNetwork(false)
    }
  }, [isConnected, account, checkNetwork])

  // Also fetch balances when network status changes
  useEffect(() => {
    if (isConnected && account && isCorrectNetwork) {
      fetchBalances()
      fetchDexStats()
    }
  }, [isCorrectNetwork])

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => {
        checkNetwork()
      }
      
      window.ethereum.on('chainChanged', handleChainChanged)
      return () => window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
    return undefined
  }, [checkNetwork])

  // Get real quote from AMM DEX contract
  const getQuote = async () => {
    if (!fromAmount || parseFloat(fromAmount) <= 0 || !window.ethereum || !isCorrectNetwork) {
      setToAmount('')
      setQuote(null)
      return
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const dexContract = new ethers.Contract(CONTRACTS.DEX, DEX_ABI, provider)
      
      const inputAmount = ethers.parseEther(fromAmount)
      
      // TTRUST is the native token, ORACLE is our ERC20 token
      // Since the AMM contract uses the same address for both tokens as a placeholder,
      // we manually calculate quotes using the AMM formula (constant product with 0.3% fee)
      let amountOut
      
      if (fromToken === 'TTRUST') {
        // TTRUST (native) → ORACLE (ERC20) swap calculation
        // Formula: (amountIn * 9970 * oracleReserve) / (tTrustReserve * 10000 + amountIn * 9970)
        const amountInWithFee = inputAmount * BigInt(9970) // 0.3% fee = 99.7% remains
        const numerator = amountInWithFee * ethers.parseEther(dexStats.oracleReserve)
        const denominator = ethers.parseEther(dexStats.ethReserve) * BigInt(10000) + amountInWithFee
        amountOut = numerator / denominator
      } else {
        // ORACLE (ERC20) → TTRUST (native) swap calculation  
        // Formula: (amountIn * 9970 * tTrustReserve) / (oracleReserve * 10000 + amountIn * 9970)
        const amountInWithFee = inputAmount * BigInt(9970) // 0.3% fee = 99.7% remains
        const numerator = amountInWithFee * ethers.parseEther(dexStats.ethReserve)
        const denominator = ethers.parseEther(dexStats.oracleReserve) * BigInt(10000) + amountInWithFee
        amountOut = numerator / denominator
      }
      const outputAmount = ethers.formatEther(amountOut)
      
      // Calculate price impact based on current reserves
      const currentRate = dexStats.currentPrice
      const expectedOutput = fromToken === 'TTRUST' 
        ? parseFloat(fromAmount) * currentRate
        : parseFloat(fromAmount) / currentRate
      
      const actualOutput = parseFloat(outputAmount)
      const priceImpact = Math.abs((expectedOutput - actualOutput) / expectedOutput) * 100
      
      setToAmount(outputAmount)
      setQuote({
        inputAmount: fromAmount,
        outputAmount: outputAmount,
        priceImpact: priceImpact,
        minimumReceived: (parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6),
        exchangeRate: fromToken === 'TTRUST' ? dexStats.currentPrice : 1 / dexStats.currentPrice
      })
    } catch (error) {
      console.error('Failed to get AMM quote:', error)
      setToAmount('')
      setQuote(null)
    }
  }

  // Calculate quote when amounts change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      getQuote()
    }, 500) // Debounce API calls
    
    return () => clearTimeout(timeoutId)
  }, [fromAmount, fromToken, toToken, slippage, dexStats])

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleSwap = async () => {
    if (!quote || !isConnected || !account || !window.ethereum) return

    setIsLoading(true)
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const dexContract = new ethers.Contract(CONTRACTS.DEX, DEX_ABI, signer)
      
      const inputAmount = ethers.parseEther(fromAmount)
      const minAmountOut = ethers.parseEther(quote.minimumReceived)
      
      let tx

      if (fromToken === 'TTRUST') {
        // TTRUST (native) → ORACLE (ERC20) swap
        // Send native token via msg.value
        tx = await dexContract.swapTrustForOracle(0, minAmountOut, {
          value: inputAmount, // Native token sent via value
          gasLimit: 200000
        })
      } else {
        // ORACLE (ERC20) → TTRUST (native) swap
        // First check/approve ERC20 allowance
        const oracleContract = new ethers.Contract(CONTRACTS.OracleToken, ORACLE_TOKEN_ABI, signer)
        const allowance = await oracleContract.allowance(account, CONTRACTS.DEX)
        
        if (allowance < inputAmount) {
          const approveTx = await oracleContract.approve(CONTRACTS.DEX, inputAmount)
          await approveTx.wait()
        }
        
        // Swap ERC20 for native token
        tx = await dexContract.swapOracleForTrust(inputAmount, minAmountOut, {
          gasLimit: 200000
        })
      }

      // Wait for transaction confirmation
      const receipt = await tx.wait()
      
      // Track swap transaction for analytics
      try {
        if (account && receipt.hash) {
          // Track volume as the TTRUST amount involved in the swap
          const volumeTTRUST = fromToken === 'TTRUST' ? fromAmount : toAmount
          trackTransaction(
            receipt.hash,
            'swap',
            account,
            `${fromToken}→${toToken}`,
            `${fromAmount} ${fromToken}`,
            volumeTTRUST
          )
        }
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError)
      }
      
      // Success notification
      if (typeof window !== 'undefined' && (window as any).showNotification) {
        (window as any).showNotification('success', `Successfully swapped ${fromAmount} ${fromToken} for ${quote.outputAmount} ${toToken}`, receipt.hash)
      }
      
      // Reset form and refresh data
      setFromAmount('')
      setToAmount('')
      setQuote(null)
      
      // Refresh balances and DEX stats
      await fetchBalances()
      await fetchDexStats()
      
    } catch (error: any) {
      console.error('Swap error:', error)
      
      if (error.code === 4001 || error.message.includes('rejected')) {
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification('rejected', 'Transaction was rejected by user')
        }
      } else {
        if (typeof window !== 'undefined' && (window as any).showNotification) {
          (window as any).showNotification('error', error.message || 'Swap failed unexpectedly')
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getTokenInfo = (token: 'TTRUST' | 'ORACLE') => {
    // Calculate dynamic prices based on AMM reserves
    const ttrustPrice = 2500 // Base TTRUST price in USD
    const oraclePrice = dexStats.currentPrice > 0 ? ttrustPrice / dexStats.currentPrice : 0.005
    
    return {
      TTRUST: {
        name: 'Testnet TRUST (Native)',
        symbol: 'TTRUST',
        icon: '⚡',
        price: `${ttrustPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      ORACLE: {
        name: 'Oracle Token (ERC20)',
        symbol: 'ORACLE',
        icon: <TokenIcon token="ORACLE" size="sm" />,
        price: `${oraclePrice.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`
      }
    }[token]
  }

  // For dropdown options (text only)
  const getTokenTextIcon = (token: 'TTRUST' | 'ORACLE') => {
    return {
      TTRUST: '⚡',
      ORACLE: 'ORACLE' // Use text name for dropdown since HTML options can't contain images
    }[token]
  }

  const slippageOptions = [0.1, 0.5, 1.0, 2.0]

  // Calculate volume in USD for analytics
  const calculateVolumeUSD = (token: string, amount: string) => {
    const amountFloat = parseFloat(amount)
    const prices = {
      TTRUST: 2500,
      ORACLE: dexStats.currentPrice > 0 ? 2500 / dexStats.currentPrice : 0.005
    }
    const price = prices[token as keyof typeof prices] || 0
    return (amountFloat * price).toFixed(2)
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold gradient-text mb-2 sm:mb-4">Token Swap</h1>
        <p className="text-sm sm:text-base text-gray-400">Live market rates with real-time fluctuation</p>
      </div>

      {isInitializing && (
        <div className="glass-effect rounded-xl p-8 border border-blue-500/30 text-center">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-white mb-2">Checking Wallet Connection</h3>
          <p className="text-gray-400">Please wait while we check for existing wallet connections...</p>
        </div>
      )}

      {!isInitializing && !isConnected && (
        <div className="glass-effect rounded-xl p-8 border border-yellow-500/30 text-center">
          <i className="fas fa-wallet text-yellow-400 text-4xl mb-4"></i>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Please connect your wallet to start trading.</p>
        </div>
      )}

      {isConnected && !isCorrectNetwork && (
        <div className="glass-effect rounded-xl p-8 border border-red-500/30 text-center">
          <i className="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
          <h3 className="text-xl font-bold text-white mb-2">Wrong Network</h3>
          <p className="text-gray-400 mb-4">Please switch to Intuition Testnet to use this DEX.</p>
          <button
            onClick={switchToIntuitionTestnet}
            className="btn-primary px-6 py-3 rounded-lg font-medium"
          >
            Switch to Intuition Testnet
          </button>
        </div>
      )}

      {isConnected && isCorrectNetwork && (
        <>
          {/* Token Balances */}
          <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <i className="fas fa-wallet text-green-400 mr-3"></i>
                Your Balances
              </h2>
              <div className="flex items-center space-x-3">
                {/* Debug info - remove after fixing */}
                <div className="text-xs text-gray-500 glass-effect px-2 py-1 rounded border border-gray-600/30">
                  Connected: {isConnected ? '✓' : '✗'} | 
                  Network: {isCorrectNetwork ? '✓' : '✗'} | 
                  Account: {account ? '✓' : '✗'}
                </div>
                <button
                  onClick={() => {
                    // Production: Remove console.log
                    // console.log('Manual refresh clicked', { isConnected, account, isCorrectNetwork })
                    fetchBalances()
                    fetchDexStats()
                  }}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 glass-effect border border-gray-600/50 rounded-lg text-gray-400 hover:text-white hover:border-green-500/50 transition-all min-h-[44px]"
                  title="Refresh balances"
                >
                  <i className="fas fa-sync-alt"></i>
                  <span className="text-sm">Refresh</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {(['TTRUST', 'ORACLE'] as const).map((token) => {
                const info = getTokenInfo(token)
                return (
                  <div key={token} className="glass-effect rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {token === 'ORACLE' ? (
                          <TokenIcon token="ORACLE" size="lg" />
                        ) : (
                          <span className="text-2xl">{info.icon}</span>
                        )}
                        <div>
                          <h3 className="font-bold text-white">{info.symbol}</h3>
                          <p className="text-sm text-gray-400">{info.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {parseFloat(balances[token]).toFixed(4)} {token}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Swap Interface */}
          <div className="max-w-full sm:max-w-md mx-auto">
            <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Swap Tokens</h2>
                <div className="relative">
                  <button 
                    onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                    className="flex items-center space-x-2 px-3 py-2 glass-effect border border-gray-600/50 rounded-lg text-gray-400 hover:text-white hover:border-purple-500/50 transition-all"
                  >
                    <i className="fas fa-cog"></i>
                    <span className="text-sm">Settings</span>
                  </button>
                  
                  {showSlippageSettings && (
                    <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 top-20 sm:top-12 w-auto sm:w-64 glass-effect border border-gray-600/50 rounded-lg p-4 z-30">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-white">Slippage Tolerance</h3>
                        <button 
                          onClick={() => setShowSlippageSettings(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1 sm:gap-2 mb-3">
                        {slippageOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => setSlippage(option)}
                            className={`px-2 py-1.5 text-xs rounded transition-colors min-h-[44px] sm:min-h-0 ${
                              slippage === option
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {option}%
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={slippage}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0.5;
                            // Security: Limit slippage between 0.1% and 10% to prevent exploitation
                            const safeSlippage = Math.min(Math.max(0.1, value), 10);
                            setSlippage(safeSlippage);
                          }}
                          step="0.1"
                          min="0.1"
                          max="10"
                          className="flex-1 px-3 py-2 sm:px-2 sm:py-1.5 text-sm sm:text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-purple-500 outline-none min-h-[44px] sm:min-h-0"
                          placeholder="Custom"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Higher slippage = higher chance of success, but worse price
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* From Token */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">From</label>
                    <span className="text-xs text-gray-400">
                      Balance: {parseFloat(balances[fromToken]).toFixed(4)}
                    </span>
                  </div>
                  <div className="glass-effect rounded-lg p-3 sm:p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-lg sm:text-xl font-bold text-white placeholder-gray-500 flex-1 outline-none w-full"
                      />
                      <div className="relative">
                        <select
                          value={fromToken}
                          onChange={(e) => setFromToken(e.target.value as 'TTRUST' | 'ORACLE')}
                          className="appearance-none bg-gray-700/50 rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base text-white font-medium cursor-pointer hover:bg-gray-600/50 transition-colors border border-gray-600/30 focus:border-purple-500/50 outline-none min-h-[44px]"
                        >
                          {(['TTRUST', 'ORACLE'] as const).map((token) => (
                            <option key={token} value={token} className="bg-gray-800">
                              {token === 'ORACLE' ? '👁️ ORACLE' : `${getTokenTextIcon(token)} ${token}`}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1 sm:gap-2">
                      <button
                        onClick={() => setFromAmount((parseFloat(balances[fromToken]) * 0.25).toString())}
                        className="py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors min-h-[44px]"
                      >
                        25%
                      </button>
                      <button
                        onClick={() => setFromAmount((parseFloat(balances[fromToken]) * 0.5).toString())}
                        className="py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors min-h-[44px]"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => setFromAmount((parseFloat(balances[fromToken]) * 0.75).toString())}
                        className="py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors min-h-[44px]"
                      >
                        75%
                      </button>
                      <button
                        onClick={() => setFromAmount(balances[fromToken])}
                        className="py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors min-h-[44px]"
                      >
                        MAX
                      </button>
                    </div>
                  </div>
                </div>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleSwapTokens}
                    className="w-10 h-10 rounded-full bg-gray-800 border-2 border-gray-600 hover:border-purple-500 text-gray-400 hover:text-purple-400 transition-all duration-200 hover:scale-110"
                  >
                    <i className="fas fa-arrow-down"></i>
                  </button>
                </div>

                {/* To Token */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">To</label>
                    <span className="text-xs text-gray-400">
                      Balance: {parseFloat(balances[toToken]).toFixed(4)}
                    </span>
                  </div>
                  <div className="glass-effect rounded-lg p-3 sm:p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={toAmount}
                        readOnly
                        placeholder="0.00"
                        className="bg-transparent text-lg sm:text-xl font-bold text-white placeholder-gray-500 flex-1 outline-none w-full"
                      />
                      <div className="relative">
                        <select
                          value={toToken}
                          onChange={(e) => setToToken(e.target.value as 'TTRUST' | 'ORACLE')}
                          className="appearance-none bg-gray-700/50 rounded-lg px-2 sm:px-3 py-2 text-sm sm:text-base text-white font-medium cursor-pointer hover:bg-gray-600/50 transition-colors border border-gray-600/30 focus:border-purple-500/50 outline-none min-h-[44px]"
                        >
                          {(['TTRUST', 'ORACLE'] as const).map((token) => (
                            <option key={token} value={token} className="bg-gray-800">
                              {token === 'ORACLE' ? '👁️ ORACLE' : `${getTokenTextIcon(token)} ${token}`}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Swap Details */}
                {quote && (
                  <div className="glass-effect rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exchange Rate:</span>
                      <span className="text-white">
                        1 {fromToken} = {quote.exchangeRate.toFixed(fromToken === 'TTRUST' ? 0 : 6)} {toToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price Impact:</span>
                      <span className={`${quote.priceImpact < 1 ? 'text-green-400' : quote.priceImpact < 3 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {quote.priceImpact.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Minimum Received:</span>
                      <span className="text-white">{quote.minimumReceived} {toToken}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slippage Tolerance:</span>
                      <span className="text-white">{slippage}%</span>
                    </div>
                  </div>
                )}

                {/* Swap Button */}
                <button
                  onClick={handleSwap}
                  disabled={!fromAmount || !toAmount || !quote || isLoading || fromToken === toToken}
                  className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 min-h-[44px] ${
                    !fromAmount || !toAmount || !quote || isLoading || fromToken === toToken
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/25'
                  } flex items-center justify-center space-x-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>Swapping...</span>
                    </>
                  ) : fromToken === toToken ? (
                    <span>Select Different Tokens</span>
                  ) : !fromAmount || !toAmount ? (
                    <span>Enter Amount</span>
                  ) : (
                    <>
                      <i className="fas fa-exchange-alt"></i>
                      <span>Swap {fromToken} for {toToken}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Live Token Rates */}
          <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4 flex flex-wrap items-center gap-2">
              <i className="fas fa-chart-line text-green-400 mr-3"></i>
              Live Token Rates
              <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                <i className="fas fa-circle animate-pulse mr-1"></i>
                LIVE
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="glass-effect rounded-lg p-3 sm:p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2 flex items-center justify-center space-x-2">
                    <span>⚡</span>
                    <span>→</span>
                    <TokenIcon token="ORACLE" size="lg" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">TTRUST to ORACLE</h3>
                  <p className="text-xl sm:text-2xl font-bold text-green-400">
                    1 : {dexStats.currentPrice > 0 ? dexStats.currentPrice.toFixed(0) : '500,000'}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    1 TTRUST = {dexStats.currentPrice > 0 ? dexStats.currentPrice.toFixed(0) : '500,000'} ORACLE
                  </p>
                </div>
              </div>
              
              <div className="glass-effect rounded-lg p-3 sm:p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl mb-2 flex items-center justify-center space-x-2">
                    <TokenIcon token="ORACLE" size="lg" />
                    <span>→</span>
                    <span>⚡</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white mb-1">ORACLE to TTRUST</h3>
                  <p className="text-xl sm:text-2xl font-bold text-cyan-400">
                    {dexStats.currentPrice > 0 ? dexStats.currentPrice.toFixed(0) : '500,000'} : 1
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {dexStats.currentPrice > 0 ? dexStats.currentPrice.toFixed(0) : '500,000'} ORACLE = 1 TTRUST
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <i className="fas fa-pool text-blue-400 mt-1"></i>
                <div className="text-sm">
                  <h4 className="text-blue-300 font-medium mb-2">AMM Liquidity Pool</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-gray-300">
                    <div>
                      <p className="text-blue-200">TTRUST Reserve:</p>
                      <p className="font-mono">{parseFloat(dexStats.ethReserve).toFixed(4)} TTRUST</p>
                    </div>
                    <div>
                      <p className="text-blue-200">ORACLE Reserve:</p>
                      <p className="font-mono">{parseFloat(dexStats.oracleReserve).toLocaleString()} ORACLE</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-gray-300 mt-2">
                    <div>
                      <p className="text-blue-200">Total Volume:</p>
                      <p className="font-mono">{parseFloat(dexStats.totalVolume).toFixed(2)} TTRUST</p>
                    </div>
                    <div>
                      <p className="text-blue-200">Total Trades:</p>
                      <p className="font-mono">{dexStats.totalTrades}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 mt-2">
                    Real AMM liquidity with dynamic pricing. Native TTRUST ↔ ERC20 ORACLE using constant product formula (x × y = k).
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Discord Link */}
          <div className="text-center py-8">
            <a 
              href="https://discord.com/invite/0xintuition" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-indigo-500/25"
            >
              <i className="fab fa-discord text-xl"></i>
              <span>Join Intuition Discord</span>
              <i className="fas fa-external-link-alt text-sm opacity-75"></i>
            </a>
          </div>

        </>
      )}
    </div>
  )
}

export default DEX
