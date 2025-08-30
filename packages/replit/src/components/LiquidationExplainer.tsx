import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import TokenIcon from './TokenIcon'

interface LiquidationExplainerProps {
  targetUserAddress?: string
  onClose?: () => void
}

const LiquidationExplainer: React.FC<LiquidationExplainerProps> = ({ 
  targetUserAddress, 
  onClose 
}) => {
  const { 
    userLendingPosition, 
    protocolStats, 
    liquidate, 
    mintOracle, 
    isLoading,
    oracleTokenContract,
    oracleLendContract,
    userAddress 
  } = useContract()

  const [targetUserDebt, setTargetUserDebt] = useState('0')
  const [targetUserCollateral, setTargetUserCollateral] = useState('0')
  const [targetUserHealthRatio, setTargetUserHealthRatio] = useState(0)
  const [userOracleBalance, setUserOracleBalance] = useState('0')
  const [isUserMinter, setIsUserMinter] = useState(false)
  const [mintAmount, setMintAmount] = useState('50000')

  // Fetch target user's position and current user's ORACLE balance
  useEffect(() => {
    const fetchData = async () => {
      if (!targetUserAddress || !oracleLendContract || !oracleTokenContract || !userAddress) return

      try {
        // Get target user's position
        const [collateral, borrowed, , healthRatio, liquidatable] = 
          await oracleLendContract.getUserPosition(targetUserAddress)
        
        setTargetUserDebt(borrowed.toString())
        setTargetUserCollateral(collateral.toString())
        setTargetUserHealthRatio(Number(healthRatio))

        // Get current user's ORACLE balance
        const balance = await oracleTokenContract.balanceOf(userAddress)
        setUserOracleBalance(balance.toString())

        // Check if current user is a minter
        const minter = await oracleTokenContract.isMinter(userAddress)
        setIsUserMinter(minter)

      } catch (error) {
        console.error('Error fetching liquidation data:', error)
      }
    }

    fetchData()
  }, [targetUserAddress, oracleLendContract, oracleTokenContract, userAddress])

  const handleLiquidate = async () => {
    if (!targetUserAddress) return
    
    const result = await liquidate(targetUserAddress)
    if (result.success && onClose) {
      onClose()
    }
  }

  const handleMintOracle = async () => {
    const result = await mintOracle(mintAmount)
    if (result.success) {
      // Refresh ORACLE balance
      if (oracleTokenContract && userAddress) {
        const balance = await oracleTokenContract.balanceOf(userAddress)
        setUserOracleBalance(balance.toString())
      }
    }
  }

  const formatEther = (value: string) => {
    try {
      return parseFloat(value) / 1e18
    } catch {
      return 0
    }
  }

  const debtAmount = formatEther(targetUserDebt)
  const collateralAmount = formatEther(targetUserCollateral)
  const oracleBalance = formatEther(userOracleBalance)
  const currentPrice = parseFloat(protocolStats.currentPrice) / 1e18
  
  const collateralValue = collateralAmount * currentPrice
  const liquidationBonus = collateralAmount * 0.1 // 10% bonus
  const totalReward = collateralAmount + liquidationBonus

  const hasEnoughOracle = oracleBalance >= debtAmount
  const isLiquidatable = targetUserHealthRatio < 120 && targetUserHealthRatio > 0

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Liquidation Guide</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* What is Liquidation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">🔍 What is Liquidation?</h3>
          <div className="bg-white/5 rounded-lg p-4 space-y-2 text-gray-300 text-sm">
            <p>
              <strong>Liquidation</strong> is the process of closing unhealthy loan positions when the collateral 
              value drops below the required threshold (120% collateralization ratio).
            </p>
            <p>
              <strong>As a liquidator,</strong> you repay the borrower's debt using ORACLE tokens and receive 
              their ETH collateral plus a 10% bonus as reward.
            </p>
            <p>
              <strong>Requirements:</strong> You must have enough ORACLE tokens to cover the full debt amount.
            </p>
          </div>
        </div>

        {/* Target Position Analysis */}
        {targetUserAddress && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">📊 Target Position Analysis</h3>
            <div className="glassmorphism-tier-mythic rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Target Address:</span>
                <span className="text-white font-mono text-sm">
                  {targetUserAddress.slice(0, 6)}...{targetUserAddress.slice(-4)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Debt Amount:</span>
                <div className="flex items-center space-x-2">
                  <TokenIcon token="ORACLE" size="sm" />
                  <span className="text-white font-semibold">
                    {debtAmount.toLocaleString()} ORACLE
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Collateral:</span>
                <div className="flex items-center space-x-2">
                  <TokenIcon token="tTRUST" size="sm" />
                  <span className="text-white font-semibold">
                    {collateralAmount.toLocaleString()} TTRUST
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">Health Ratio:</span>
                <span className={`font-semibold ${
                  targetUserHealthRatio < 120 ? 'text-red-400' : 
                  targetUserHealthRatio < 150 ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {targetUserHealthRatio}%
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-300">Status:</span>
                <span className={`font-semibold ${
                  isLiquidatable ? 'text-red-400' : 'text-green-400'
                }`}>
                  {isLiquidatable ? '⚠️ Liquidatable' : '✅ Safe'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Liquidation Requirements */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-3">📋 Your Liquidation Status</h3>
          <div className="glassmorphism-tier-mythic rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-300">Your ORACLE Balance:</span>
              <div className="flex items-center space-x-2">
                <TokenIcon token="ORACLE" size="sm" />
                <span className="text-white font-semibold">
                  {oracleBalance.toLocaleString()} ORACLE
                </span>
              </div>
            </div>
            
            {targetUserAddress && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-300">Required ORACLE:</span>
                  <div className="flex items-center space-x-2">
                    <TokenIcon token="ORACLE" size="sm" />
                    <span className="text-white font-semibold">
                      {debtAmount.toLocaleString()} ORACLE
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-semibold ${
                    hasEnoughOracle ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {hasEnoughOracle ? '✅ Sufficient' : '❌ Insufficient'}
                  </span>
                </div>

                {!hasEnoughOracle && (
                  <div className="flex justify-between">
                    <span className="text-gray-300">Missing:</span>
                    <div className="flex items-center space-x-2">
                      <TokenIcon token="ORACLE" size="sm" />
                      <span className="text-red-400 font-semibold">
                        {(debtAmount - oracleBalance).toLocaleString()} ORACLE
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Liquidation Rewards */}
        {targetUserAddress && isLiquidatable && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">💰 Liquidation Rewards</h3>
            <div className="glassmorphism-tier-rare rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">ETH Collateral:</span>
                <div className="flex items-center space-x-2">
                  <TokenIcon token="tTRUST" size="sm" />
                  <span className="text-white font-semibold">
                    {collateralAmount.toLocaleString()} TTRUST
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-300">10% Liquidation Bonus:</span>
                <div className="flex items-center space-x-2">
                  <TokenIcon token="tTRUST" size="sm" />
                  <span className="text-green-400 font-semibold">
                    +{liquidationBonus.toLocaleString()} TTRUST
                  </span>
                </div>
              </div>
              
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="text-white font-semibold">Total Reward:</span>
                <div className="flex items-center space-x-2">
                  <TokenIcon token="tTRUST" size="sm" />
                  <span className="text-green-400 font-bold">
                    {totalReward.toLocaleString()} TTRUST
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Get ORACLE Tokens Section */}
        {!hasEnoughOracle && targetUserAddress && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">🏭 Get ORACLE Tokens</h3>
            <div className="glassmorphism-card rounded-lg p-4 space-y-4">
              {isUserMinter ? (
                <div className="space-y-3">
                  <p className="text-green-400 text-sm">
                    ✅ You are authorized to mint ORACLE tokens!
                  </p>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      placeholder="Amount to mint"
                      className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleMintOracle}
                      disabled={isLoading}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all"
                    >
                      {isLoading ? 'Minting...' : 'Mint ORACLE'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-sm text-gray-300">
                  <p>💡 Ways to get ORACLE tokens:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>🔄 Swap TTRUST for ORACLE on the DEX</li>
                    <li>💰 Borrow ORACLE using ETH as collateral</li>
                    <li>🎁 Receive transfer from another user</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {targetUserAddress && isLiquidatable && hasEnoughOracle && (
            <button
              onClick={handleLiquidate}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all"
            >
              {isLoading ? 'Liquidating...' : 'Liquidate Position'}
            </button>
          )}
          
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-all"
            >
              Close
            </button>
          )}
        </div>

        {/* Educational Note */}
        <div className="mt-6 p-4 glassmorphism-tier-rare rounded-lg">
          <p className="text-blue-300 text-sm">
            <strong>💡 Pro Tip:</strong> Liquidation helps maintain the protocol's health by ensuring 
            all loans remain properly collateralized. As a liquidator, you provide a valuable service 
            to the protocol while earning rewards.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LiquidationExplainer
