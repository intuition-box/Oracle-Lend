import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'
import { SwapQuote } from '../types'
import { trackTransaction, initializeAnalytics } from '../utils/analyticsTracker'
import TokenIcon from './TokenIcon'

const DEX: React.FC = () => {
  const { swap, isLoading, getTokenBalances, exchangeRates } = useContract()
  const { isConnected, account, balance } = useWallet()
  
  const [fromToken, setFromToken] = useState<'tTRUST' | 'ORACLE' | 'INTUIT'>('tTRUST')
  const [toToken, setToToken] = useState<'tTRUST' | 'ORACLE' | 'INTUIT'>('ORACLE')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [balances, setBalances] = useState({ tTRUST: '0', ORACLE: '0', INTUIT: '0' })
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [slippage, setSlippage] = useState(0.5)
  const [transactionStatus, setTransactionStatus] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
    txHash?: string
  } | null>(null)
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)

  // Exchange rate: 1 tTRUST = 100 ORACLE = 100 INTUIT, 1 ORACLE = 1 INTUIT
  const EXCHANGE_RATE = 100

  // Initialize analytics and fetch balances when wallet connects
  useEffect(() => {
    // Initialize analytics tracking
    initializeAnalytics()
    
    if (isConnected && account) {
      getTokenBalances(account).then(contractBalances => {
        setBalances({
          tTRUST: balance, // Use real wallet balance for tTRUST
          ORACLE: contractBalances.ORACLE,
          INTUIT: contractBalances.INTUIT
        })
      })
    } else {
      setBalances({ tTRUST: '0', ORACLE: '0', INTUIT: '0' })
    }
  }, [isConnected, account, balance, getTokenBalances])

  // Calculate quote when amounts change
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      const inputAmount = parseFloat(fromAmount)
      
      // Use dynamic exchange rates
      let rate = 1
      
      if (fromToken === 'tTRUST' && toToken === 'ORACLE') {
        rate = exchangeRates.tTRUST_ORACLE
      } else if (fromToken === 'ORACLE' && toToken === 'tTRUST') {
        rate = 1 / exchangeRates.tTRUST_ORACLE
      } else if (fromToken === 'tTRUST' && toToken === 'INTUIT') {
        rate = exchangeRates.tTRUST_INTUIT
      } else if (fromToken === 'INTUIT' && toToken === 'tTRUST') {
        rate = 1 / exchangeRates.tTRUST_INTUIT
      } else if (fromToken === 'ORACLE' && toToken === 'INTUIT') {
        rate = exchangeRates.ORACLE_INTUIT
      } else if (fromToken === 'INTUIT' && toToken === 'ORACLE') {
        rate = 1 / exchangeRates.ORACLE_INTUIT
      }
      
      const outputAmount = inputAmount * rate
      
      // Simulate small price impact
      const priceImpact = Math.min(inputAmount * 0.001, 0.05) // Max 5% impact
      const adjustedOutput = outputAmount * (1 - priceImpact)
      
      setToAmount(adjustedOutput.toFixed(6))
      setQuote({
        inputAmount: fromAmount,
        outputAmount: adjustedOutput.toFixed(6),
        priceImpact: priceImpact * 100,
        minimumReceived: (adjustedOutput * (1 - slippage / 100)).toFixed(6),
        exchangeRate: rate
      })
    } else {
      setToAmount('')
      setQuote(null)
    }
  }, [fromAmount, fromToken, toToken, slippage, exchangeRates])

  const handleSwapTokens = () => {
    setFromToken(toToken)
    setToToken(fromToken)
    setFromAmount(toAmount)
    setToAmount(fromAmount)
  }

  const handleSwap = async () => {
    if (!quote || !isConnected) return

    const result = await swap(fromToken, toToken, fromAmount)
    
    if (result.success) {
      // Track swap transaction for analytics
      if (account && result.txHash) {
        const volumeUSD = calculateVolumeUSD(fromToken, fromAmount)
        trackTransaction(
          result.txHash,
          'swap',
          account,
          `${fromToken}→${toToken}`,
          `${fromAmount} ${fromToken}`,
          volumeUSD
        )
      }
      
      setFromAmount('')
      setToAmount('')
      setTransactionStatus({
        show: true,
        type: 'success',
        message: `Successfully swapped ${fromAmount} ${fromToken} for ${result.outputAmount} ${toToken}`,
        txHash: result.txHash
      })
      
      // Refresh balances after swap
      if (account) {
        const contractBalances = await getTokenBalances(account)
        setBalances({
          tTRUST: balance, // Use real wallet balance for tTRUST
          ORACLE: contractBalances.ORACLE,
          INTUIT: contractBalances.INTUIT
        })
      }
    } else {
      setTransactionStatus({
        show: true,
        type: 'error',
        message: result.error || 'Transaction failed'
      })
    }

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setTransactionStatus(null)
    }, 5000)
  }

  const getTokenInfo = (token: 'tTRUST' | 'ORACLE' | 'INTUIT') => {
    // Calculate dynamic prices based on exchange rates
    const basePrice = 2500 // Base tTRUST price
    const oraclePrice = basePrice / exchangeRates.tTRUST_ORACLE
    const intuintPrice = basePrice / exchangeRates.tTRUST_INTUIT
    
    return {
      tTRUST: {
        name: 'Intuition Trust Token',
        symbol: 'tTRUST',
        icon: '⚡',
        price: `$${basePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      ORACLE: {
        name: 'Oracle Token',
        symbol: 'ORACLE',
        icon: <TokenIcon token="ORACLE" size="sm" />,
        price: `$${oraclePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      },
      INTUIT: {
        name: 'INTUIT',
        symbol: 'INTUIT',
        icon: '💎',
        price: `$${intuintPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }
    }[token]
  }

  // For dropdown options (text only)
  const getTokenTextIcon = (token: 'tTRUST' | 'ORACLE' | 'INTUIT') => {
    return {
      tTRUST: '⚡',
      ORACLE: '🔮', // Text fallback for dropdown
      INTUIT: '💎'
    }[token]
  }

  const slippageOptions = [0.1, 0.5, 1.0, 2.0]

  // Calculate volume in USD for analytics
  const calculateVolumeUSD = (token: string, amount: string) => {
    const amountFloat = parseFloat(amount)
    const prices = {
      tTRUST: 2500,
      ORACLE: 25,
      INTUIT: 25
    }
    const price = prices[token as keyof typeof prices] || 0
    return (amountFloat * price).toFixed(2)
  }

  return (
    <div className="space-y-8">
      {/* Transaction Status Notification */}
      {transactionStatus && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg border ${
          transactionStatus.type === 'success' 
            ? 'bg-green-900/90 border-green-500/50 text-green-100' 
            : 'bg-red-900/90 border-red-500/50 text-red-100'
        } backdrop-blur-sm animate-pulse`}>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {transactionStatus.type === 'success' ? (
                <i className="fas fa-check-circle text-green-400 text-xl"></i>
              ) : (
                <i className="fas fa-exclamation-circle text-red-400 text-xl"></i>
              )}
            </div>
            <div className="flex-1">
              <h4 className="font-bold mb-1">
                {transactionStatus.type === 'success' ? 'Transaction Successful!' : 'Transaction Failed'}
              </h4>
              <p className="text-sm opacity-90">{transactionStatus.message}</p>
              {transactionStatus.txHash && (
                <p className="text-xs mt-2 opacity-70">
                  Tx: {transactionStatus.txHash.slice(0, 10)}...{transactionStatus.txHash.slice(-8)}
                </p>
              )}
            </div>
            <button 
              onClick={() => setTransactionStatus(null)}
              className="flex-shrink-0 text-gray-400 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Token Swap</h1>
        <p className="text-gray-400">Live market rates with real-time fluctuation</p>
      </div>

      {!isConnected && (
        <div className="glass-effect rounded-xl p-8 border border-yellow-500/30 text-center">
          <i className="fas fa-wallet text-yellow-400 text-4xl mb-4"></i>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Please connect your wallet to start trading.</p>
        </div>
      )}

      {isConnected && (
        <>
          {/* Token Balances */}
          <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <i className="fas fa-wallet text-green-400 mr-3"></i>
              Your Balances
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['tTRUST', 'ORACLE', 'INTUIT'] as const).map((token) => {
                const info = getTokenInfo(token)
                return (
                  <div key={token} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h3 className="font-bold text-white">{info.symbol}</h3>
                          <p className="text-sm text-gray-400">{info.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">
                          {parseFloat(balances[token]).toFixed(4)}
                        </p>
                        <p className="text-sm text-gray-400">{info.price}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Swap Interface */}
          <div className="max-w-md mx-auto">
            <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Swap Tokens</h2>
                <div className="relative">
                  <button 
                    onClick={() => setShowSlippageSettings(!showSlippageSettings)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-800/50 border border-gray-600/50 rounded-lg text-gray-400 hover:text-white hover:border-purple-500/50 transition-all"
                  >
                    <i className="fas fa-cog"></i>
                    <span className="text-sm">Settings</span>
                  </button>
                  
                  {showSlippageSettings && (
                    <div className="absolute right-0 top-12 w-64 glass-effect border border-gray-600/50 rounded-lg p-4 z-20">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-white">Slippage Tolerance</h3>
                        <button 
                          onClick={() => setShowSlippageSettings(false)}
                          className="text-gray-400 hover:text-white"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        {slippageOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => setSlippage(option)}
                            className={`px-2 py-1.5 text-xs rounded transition-colors ${
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
                          onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                          step="0.1"
                          min="0.1"
                          max="50"
                          className="flex-1 px-2 py-1.5 text-xs bg-gray-800 border border-gray-600 rounded text-white focus:border-purple-500 outline-none"
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
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-xl font-bold text-white placeholder-gray-500 flex-1 outline-none"
                      />
                      <div className="relative">
                        <select
                          value={fromToken}
                          onChange={(e) => setFromToken(e.target.value as 'tTRUST' | 'ORACLE' | 'INTUIT')}
                          className="appearance-none bg-gray-700/50 rounded-lg px-3 py-2 text-white font-medium cursor-pointer hover:bg-gray-600/50 transition-colors border border-gray-600/30 focus:border-purple-500/50 outline-none"
                        >
                          {(['tTRUST', 'ORACLE', 'INTUIT'] as const).map((token) => (
                            <option key={token} value={token} className="bg-gray-800">
                              {getTokenTextIcon(token)} {token}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setFromAmount((parseFloat(balances[fromToken]) * 0.25).toString())}
                        className="flex-1 py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors"
                      >
                        25%
                      </button>
                      <button
                        onClick={() => setFromAmount((parseFloat(balances[fromToken]) * 0.5).toString())}
                        className="flex-1 py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => setFromAmount((parseFloat(balances[fromToken]) * 0.75).toString())}
                        className="flex-1 py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors"
                      >
                        75%
                      </button>
                      <button
                        onClick={() => setFromAmount(balances[fromToken])}
                        className="flex-1 py-2 text-xs text-purple-400 hover:text-purple-300 rounded bg-purple-600/20 transition-colors"
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
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={toAmount}
                        readOnly
                        placeholder="0.00"
                        className="bg-transparent text-xl font-bold text-white placeholder-gray-500 flex-1 outline-none"
                      />
                      <div className="relative">
                        <select
                          value={toToken}
                          onChange={(e) => setToToken(e.target.value as 'tTRUST' | 'ORACLE' | 'INTUIT')}
                          className="appearance-none bg-gray-700/50 rounded-lg px-3 py-2 text-white font-medium cursor-pointer hover:bg-gray-600/50 transition-colors border border-gray-600/30 focus:border-purple-500/50 outline-none"
                        >
                          {(['tTRUST', 'ORACLE', 'INTUIT'] as const).map((token) => (
                            <option key={token} value={token} className="bg-gray-800">
                              {getTokenTextIcon(token)} {token}
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
                  <div className="bg-gray-800/30 rounded-lg p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exchange Rate:</span>
                      <span className="text-white">
                        1 {fromToken} = {quote.exchangeRate.toFixed(fromToken === 'tTRUST' ? 0 : 6)} {toToken}
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
                  disabled={!fromAmount || !toAmount || !quote || isLoading}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
                    !fromAmount || !toAmount || !quote || isLoading
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/25'
                  } flex items-center justify-center space-x-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>Swapping...</span>
                    </>
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
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <i className="fas fa-chart-line text-green-400 mr-3"></i>
              Live Token Rates
              <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                <i className="fas fa-circle animate-pulse mr-1"></i>
                LIVE
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-3xl mb-2 flex items-center space-x-2">
                    <span>⚡</span>
                    <span>→</span>
                    <TokenIcon token="ORACLE" size="lg" />
                  </div>
                  <h3 className="font-bold text-white mb-1">tTRUST to ORACLE</h3>
                  <p className="text-2xl font-bold text-green-400">
                    1 : {exchangeRates.tTRUST_ORACLE.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    1 tTRUST = {exchangeRates.tTRUST_ORACLE.toFixed(2)} ORACLE
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡ → 💎</div>
                  <h3 className="font-bold text-white mb-1">tTRUST to INTUIT</h3>
                  <p className="text-2xl font-bold text-cyan-400">
                    1 : {exchangeRates.tTRUST_INTUIT.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    1 tTRUST = {exchangeRates.tTRUST_INTUIT.toFixed(2)} INTUIT
                  </p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-3xl mb-2 flex items-center space-x-2">
                    <TokenIcon token="ORACLE" size="lg" />
                    <span>↔</span>
                    <span>💎</span>
                  </div>
                  <h3 className="font-bold text-white mb-1">ORACLE ↔ INTUIT</h3>
                  <p className="text-2xl font-bold text-purple-400">
                    1 : {exchangeRates.ORACLE_INTUIT.toFixed(4)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    1 ORACLE = {exchangeRates.ORACLE_INTUIT.toFixed(4)} INTUIT
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-green-400 mt-1"></i>
                <div className="text-sm">
                  <h4 className="text-green-300 font-medium mb-1">Live Market Rates</h4>
                  <p className="text-gray-300">
                    Exchange rates fluctuate every 10 seconds based on market conditions. 
                    Rates shown are current market prices used for swap calculations.
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
