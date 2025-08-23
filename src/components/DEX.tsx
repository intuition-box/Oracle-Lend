import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'
import { SwapQuote } from '../types'

const DEX: React.FC = () => {
  const { swap, isLoading, getTokenBalances } = useContract()
  const { isConnected, account, balance } = useWallet()
  
  const [fromToken, setFromToken] = useState<'tTRUST' | 'ORACLE' | 'INTUINT'>('tTRUST')
  const [toToken, setToToken] = useState<'tTRUST' | 'ORACLE' | 'INTUINT'>('ORACLE')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')
  const [balances, setBalances] = useState({ tTRUST: '0', ORACLE: '0', INTUINT: '0' })
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [slippage, setSlippage] = useState(0.5)

  // Exchange rate: 1 tTRUST = 100 ORACLE = 100 INTUINT, 1 ORACLE = 1 INTUINT
  const EXCHANGE_RATE = 100

  // Fetch balances when wallet connects
  useEffect(() => {
    if (isConnected && account) {
      getTokenBalances(account).then(contractBalances => {
        setBalances({
          tTRUST: balance, // Use real wallet balance for tTRUST
          ORACLE: contractBalances.ORACLE,
          INTUINT: contractBalances.INTUINT
        })
      })
    } else {
      setBalances({ tTRUST: '0', ORACLE: '0', INTUINT: '0' })
    }
  }, [isConnected, account, balance, getTokenBalances])

  // Calculate quote when amounts change
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      const inputAmount = parseFloat(fromAmount)
      
      // Define exchange rates (using tTRUST as base)
      // 1 tTRUST = 100 ORACLE = 100 INTUINT, 1 ORACLE = 1 INTUINT
      let rate = 1
      
      if (fromToken === 'tTRUST' && toToken === 'ORACLE') {
        rate = 100 // 1 tTRUST = 100 ORACLE
      } else if (fromToken === 'ORACLE' && toToken === 'tTRUST') {
        rate = 0.01 // 100 ORACLE = 1 tTRUST
      } else if (fromToken === 'tTRUST' && toToken === 'INTUINT') {
        rate = 100 // 1 tTRUST = 100 INTUINT
      } else if (fromToken === 'INTUINT' && toToken === 'tTRUST') {
        rate = 0.01 // 100 INTUINT = 1 tTRUST
      } else if (fromToken === 'ORACLE' && toToken === 'INTUINT') {
        rate = 1 // 1 ORACLE = 1 INTUINT
      } else if (fromToken === 'INTUINT' && toToken === 'ORACLE') {
        rate = 1 // 1 INTUINT = 1 ORACLE
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
  }, [fromAmount, fromToken, toToken, slippage])

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
      setFromAmount('')
      setToAmount('')
      // Refresh balances after swap
      if (account) {
        const contractBalances = await getTokenBalances(account)
        setBalances({
          tTRUST: balance, // Use real wallet balance for tTRUST
          ORACLE: contractBalances.ORACLE,
          INTUINT: contractBalances.INTUINT
        })
      }
    }
  }

  const getTokenInfo = (token: 'tTRUST' | 'ORACLE' | 'INTUINT') => {
    return {
      tTRUST: {
        name: 'Intuition Trust Token',
        symbol: 'tTRUST',
        icon: '⚡',
        price: '$2,500.00'
      },
      ORACLE: {
        name: 'Oracle Token',
        symbol: 'ORACLE',
        icon: '🔮',
        price: '$25.00'
      },
      INTUINT: {
        name: 'Intuition Token',
        symbol: 'INTUINT',
        icon: '💎',
        price: '$25.00'
      }
    }[token]
  }

  const slippageOptions = [0.1, 0.5, 1.0, 2.0]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">Token Swap</h1>
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
              {(['tTRUST', 'ORACLE', 'INTUINT'] as const).map((token) => {
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
                <div className="flex items-center space-x-2">
                  <i className="fas fa-cog text-gray-400 cursor-pointer hover:text-white transition-colors"></i>
                  
                  {/* Slippage Settings */}
                  <div className="relative group">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <i className="fas fa-percentage"></i>
                    </button>
                    <div className="absolute right-0 top-8 w-48 glass-effect border border-gray-600/50 rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                      <p className="text-sm text-gray-400 mb-2">Slippage Tolerance</p>
                      <div className="grid grid-cols-4 gap-1 mb-2">
                        {slippageOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => setSlippage(option)}
                            className={`px-2 py-1 text-xs rounded ${
                              slippage === option
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                          >
                            {option}%
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={slippage}
                        onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                        step="0.1"
                        className="w-full px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded text-white"
                        placeholder="Custom %"
                      />
                    </div>
                  </div>
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
                    <div className="flex items-center justify-between">
                      <input
                        type="number"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-xl font-bold text-white placeholder-gray-500 flex-1 outline-none"
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setFromAmount(balances[fromToken])}
                          className="text-xs text-purple-400 hover:text-purple-300 px-2 py-1 rounded bg-purple-600/20"
                        >
                          MAX
                        </button>
                        <div className="relative">
                          <select
                            value={fromToken}
                            onChange={(e) => setFromToken(e.target.value as 'tTRUST' | 'ORACLE' | 'INTUINT')}
                            className="appearance-none bg-gray-700/50 rounded-lg px-3 py-2 text-white font-medium cursor-pointer hover:bg-gray-600/50 transition-colors border border-gray-600/30 focus:border-purple-500/50 outline-none"
                          >
                            {(['tTRUST', 'ORACLE', 'INTUINT'] as const).map((token) => (
                              <option key={token} value={token} className="bg-gray-800">
                                {getTokenInfo(token).icon} {token}
                              </option>
                            ))}
                          </select>
                          <i className="fas fa-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                        </div>
                      </div>
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
                          onChange={(e) => setToToken(e.target.value as 'tTRUST' | 'ORACLE' | 'INTUINT')}
                          className="appearance-none bg-gray-700/50 rounded-lg px-3 py-2 text-white font-medium cursor-pointer hover:bg-gray-600/50 transition-colors border border-gray-600/30 focus:border-purple-500/50 outline-none"
                        >
                          {(['tTRUST', 'ORACLE', 'INTUINT'] as const).map((token) => (
                            <option key={token} value={token} className="bg-gray-800">
                              {getTokenInfo(token).icon} {token}
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

          {/* Exchange Rate Information */}
          <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <i className="fas fa-chart-line text-blue-400 mr-3"></i>
              Exchange Rate Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡ → 🔮</div>
                  <h3 className="font-bold text-white mb-1">tTRUST to ORACLE</h3>
                  <p className="text-2xl font-bold text-green-400">1 : 100</p>
                  <p className="text-sm text-gray-400 mt-1">1 tTRUST = 100 ORACLE</p>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚡ → 💎</div>
                  <h3 className="font-bold text-white mb-1">tTRUST to INTUINT</h3>
                  <p className="text-2xl font-bold text-cyan-400">1 : 100</p>
                  <p className="text-sm text-gray-400 mt-1">1 tTRUST = 100 INTUINT</p>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
                <div className="text-center">
                  <div className="text-3xl mb-2">🔮 ↔ 💎</div>
                  <h3 className="font-bold text-white mb-1">ORACLE ↔ INTUINT</h3>
                  <p className="text-2xl font-bold text-purple-400">1 : 1</p>
                  <p className="text-sm text-gray-400 mt-1">Same value tokens</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-start space-x-3">
                <i className="fas fa-info-circle text-blue-400 mt-1"></i>
                <div className="text-sm">
                  <h4 className="text-blue-300 font-medium mb-1">Fixed Exchange Rates</h4>
                  <p className="text-gray-300">
                    Exchange rates are fixed: 1 tTRUST = 100 ORACLE = 100 INTUINT, 1 ORACLE = 1 INTUINT. 
                    ORACLE and INTUINT have the same value. Small price impacts may apply for larger trades.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default DEX
