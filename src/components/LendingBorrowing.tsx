import React, { useState } from 'react'
import { useContract } from '../hooks/useContract'
import { useWallet } from '../hooks/useWallet'

const LendingBorrowing: React.FC = () => {
  const { userPosition, lendingPools, isLoading, supply, withdraw, borrow, repay } = useContract()
  const { isConnected } = useWallet()
  
  const [activeTab, setActiveTab] = useState<'supply' | 'borrow'>('supply')
  const [selectedToken, setSelectedToken] = useState<'tTRUST' | 'ORACLE' | 'INTUINT'>('tTRUST')
  const [amount, setAmount] = useState('')
  const [action, setAction] = useState<'supply' | 'withdraw' | 'borrow' | 'repay'>('supply')

  const [transactionStatus, setTransactionStatus] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
    txHash?: string
  } | null>(null)

  const handleTransaction = async () => {
    if (!amount || !isConnected) return

    let result
    switch (action) {
      case 'supply':
        result = await supply(selectedToken, amount)
        break
      case 'withdraw':
        result = await withdraw(selectedToken, amount)
        break
      case 'borrow':
        result = await borrow(selectedToken, amount)
        break
      case 'repay':
        result = await repay(selectedToken, amount)
        break
      default:
        return
    }

    if (result.success) {
      setAmount('')
      setTransactionStatus({
        show: true,
        type: 'success',
        message: `Successfully ${action}ed ${amount} ${selectedToken}`,
        txHash: result.txHash
      })
    } else {
      setTransactionStatus({
        show: true,
        type: 'error',
        message: result.error || `${action} transaction failed`
      })
    }

    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setTransactionStatus(null)
    }, 5000)
  }

  const getTokenPool = (token: 'tTRUST' | 'ORACLE' | 'INTUINT') => {
    return lendingPools.find(pool => pool.token === token)
  }

  const formatCurrency = (value: string, decimals: number = 2) => {
    return parseFloat(value).toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    })
  }

  const calculateHealthFactor = () => {
    const collateralValue = parseFloat(userPosition.collateralValue) || 0
    const borrowValue = parseFloat(userPosition.borrowPower) || 0
    return borrowValue > 0 ? collateralValue / borrowValue : 0
  }

  const healthFactor = calculateHealthFactor()

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
        <h1 className="text-4xl font-bold gradient-text mb-4">Lending & Borrowing</h1>
      </div>

      {!isConnected && (
        <div className="glass-effect rounded-xl p-8 border border-yellow-500/30 text-center">
          <i className="fas fa-wallet text-yellow-400 text-4xl mb-4"></i>
          <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Please connect your wallet to start lending and borrowing.</p>
        </div>
      )}

      {isConnected && (
        <>
          {/* User Position Overview */}
          <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <i className="fas fa-chart-pie text-purple-400 mr-3"></i>
              Your Position
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-plus text-green-400 text-xl"></i>
                </div>
                <h4 className="font-medium text-white mb-1">Total Supplied</h4>
                <p className="text-2xl font-bold text-green-400">
                  ${formatCurrency(userPosition.collateralValue)}
                </p>
                <div className="text-sm text-gray-400 mt-1">
                  <div>{formatCurrency(userPosition.supplied.tTRUST)} tTRUST</div>
                  <div>{formatCurrency(userPosition.supplied.ORACLE)} ORACLE</div>
                  <div>{formatCurrency(userPosition.supplied.INTUINT)} INTUINT</div>
                </div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-minus text-red-400 text-xl"></i>
                </div>
                <h4 className="font-medium text-white mb-1">Total Borrowed</h4>
                <p className="text-2xl font-bold text-red-400">
                  ${formatCurrency(userPosition.borrowPower)}
                </p>
                <div className="text-sm text-gray-400 mt-1">
                  <div>{formatCurrency(userPosition.borrowed.tTRUST)} tTRUST</div>
                  <div>{formatCurrency(userPosition.borrowed.ORACLE)} ORACLE</div>
                  <div>{formatCurrency(userPosition.borrowed.INTUINT)} INTUINT</div>
                </div>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-shield-alt text-blue-400 text-xl"></i>
                </div>
                <h4 className="font-medium text-white mb-1">Available to Borrow</h4>
                <p className="text-2xl font-bold text-blue-400">
                  ${formatCurrency((parseFloat(userPosition.collateralValue) * 0.75 - parseFloat(userPosition.borrowPower)).toString())}
                </p>
                <p className="text-sm text-gray-400 mt-1">75% of collateral</p>
              </div>

              <div className="text-center">
                <div className={`w-16 h-16 rounded-full ${
                  healthFactor > 2 ? 'bg-green-500/20' : 
                  healthFactor > 1.5 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                } flex items-center justify-center mx-auto mb-3`}>
                  <i className={`fas fa-heartbeat ${
                    healthFactor > 2 ? 'text-green-400' : 
                    healthFactor > 1.5 ? 'text-yellow-400' : 'text-red-400'
                  } text-xl`}></i>
                </div>
                <h4 className="font-medium text-white mb-1">Health Factor</h4>
                <p className={`text-2xl font-bold ${
                  healthFactor > 2 ? 'text-green-400' : 
                  healthFactor > 1.5 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {healthFactor.toFixed(2)}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {healthFactor > 2 ? 'Safe' : healthFactor > 1.5 ? 'Moderate Risk' : 'High Risk'}
                </p>
              </div>
            </div>
          </div>

          {/* Markets Overview */}
          <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <i className="fas fa-store text-cyan-400 mr-3"></i>
              Markets
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lendingPools.map((pool) => (
                <div key={pool.token} className="bg-gray-800/50 rounded-lg p-6 border border-gray-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold">
                          {pool.token === 'tTRUST' ? '⚡' : pool.token === 'ORACLE' ? '🔮' : '💎'}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{pool.token}</h3>
                        <p className="text-sm text-gray-400">
                          {pool.token === 'tTRUST' ? 'Intuition Trust Token' : 
                           pool.token === 'ORACLE' ? 'Oracle Token' : 'Intuition Token'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Utilization</p>
                      <p className="text-lg font-bold text-white">{pool.utilizationRate}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Supply APY</p>
                      <p className="text-xl font-bold text-green-400">{pool.supplyAPY}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Borrow APY</p>
                      <p className="text-xl font-bold text-red-400">{pool.borrowAPY}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400 mb-1">Total Supply</p>
                      <p className="text-white">{formatCurrency(pool.totalSupply)} {pool.token}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 mb-1">Total Borrow</p>
                      <p className="text-white">{formatCurrency(pool.totalBorrow)} {pool.token}</p>
                    </div>
                  </div>

                  {/* Utilization bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${pool.utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Interface */}
          <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <i className="fas fa-exchange-alt text-green-400 mr-3"></i>
              Transaction
            </h2>

            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('supply')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'supply'
                    ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Supply / Withdraw
              </button>
              <button
                onClick={() => setActiveTab('borrow')}
                className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'borrow'
                    ? 'bg-red-600/30 text-red-300 border border-red-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                Borrow / Repay
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Action Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Action</label>
                  <div className="grid grid-cols-2 gap-2">
                    {activeTab === 'supply' ? (
                      <>
                        <button
                          onClick={() => setAction('supply')}
                          className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            action === 'supply'
                              ? 'bg-green-600/30 text-green-300 border border-green-500/30'
                              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          Supply
                        </button>
                        <button
                          onClick={() => setAction('withdraw')}
                          className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            action === 'withdraw'
                              ? 'bg-orange-600/30 text-orange-300 border border-orange-500/30'
                              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          Withdraw
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setAction('borrow')}
                          className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            action === 'borrow'
                              ? 'bg-red-600/30 text-red-300 border border-red-500/30'
                              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          Borrow
                        </button>
                        <button
                          onClick={() => setAction('repay')}
                          className={`py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                            action === 'repay'
                              ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                              : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          Repay
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Token</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSelectedToken('tTRUST')}
                      className={`py-3 px-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm ${
                        selectedToken === 'tTRUST'
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span>⚡</span>
                      <span>tTRUST</span>
                    </button>
                    <button
                      onClick={() => setSelectedToken('ORACLE')}
                      className={`py-3 px-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm ${
                        selectedToken === 'ORACLE'
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span>🔮</span>
                      <span>ORACLE</span>
                    </button>
                    <button
                      onClick={() => setSelectedToken('INTUINT')}
                      className={`py-3 px-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-1 text-sm ${
                        selectedToken === 'INTUINT'
                          ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                          : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
                      }`}
                    >
                      <span>💎</span>
                      <span>INTUINT</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 text-sm font-medium hover:text-purple-300">
                      MAX
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction Summary */}
              <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-bold text-white mb-4">Transaction Summary</h3>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Action:</span>
                    <span className="text-white capitalize">{action}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Token:</span>
                    <span className="text-white">{selectedToken}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Amount:</span>
                    <span className="text-white">{amount || '0'} {selectedToken}</span>
                  </div>
                  
                  {getTokenPool(selectedToken) && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">
                          {activeTab === 'supply' ? 'Supply APY:' : 'Borrow APY:'}
                        </span>
                        <span className={activeTab === 'supply' ? 'text-green-400' : 'text-red-400'}>
                          {activeTab === 'supply' 
                            ? getTokenPool(selectedToken)?.supplyAPY 
                            : getTokenPool(selectedToken)?.borrowAPY}%
                        </span>
                      </div>
                      
                      {amount && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Est. Annual Earnings:</span>
                          <span className="text-green-400">
                            {(parseFloat(amount) * (getTokenPool(selectedToken)?.supplyAPY || 0) / 100).toFixed(4)} {selectedToken}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <button
                  onClick={handleTransaction}
                  disabled={!amount || !isConnected || isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                    !amount || !isConnected || isLoading
                      ? 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                      : action === 'supply'
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-green-500/25'
                      : action === 'withdraw'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-orange-500/25'
                      : action === 'borrow'
                      ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-red-500/25'
                      : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-blue-500/25'
                  } flex items-center justify-center space-x-2`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <i className={`fas ${
                        action === 'supply' ? 'fa-plus' :
                        action === 'withdraw' ? 'fa-minus' :
                        action === 'borrow' ? 'fa-download' : 'fa-upload'
                      }`}></i>
                      <span className="capitalize">{action} {selectedToken}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LendingBorrowing
