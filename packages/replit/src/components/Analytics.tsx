import React, { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import TokenIcon from './TokenIcon'

const Analytics: React.FC = () => {
  const { 
    protocolStats, 
    isLoading, 
    oracleTokenContract, 
    oracleLendContract,
    dexContract,
    isConnected 
  } = useContract()
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h')
  const [realTimeData, setRealTimeData] = useState({
    totalTVL: { tTRUST: '0', ORACLE: '0', usd: '0' },
    totalTransactions: 0,
    volume24h: '0',
    dexReserves: { tTRUST: '0', ORACLE: '0' },
    lendingStats: { totalCollateral: '0', totalBorrowed: '0', oracleBalance: '0' }
  })
  const [dataLoading, setDataLoading] = useState(true)

  // Fetch real-time data from contracts
  useEffect(() => {
    const fetchRealTimeData = async () => {
      console.log('🔄 Fetching analytics data...')
      console.log('Contracts available:', {
        dexContract: !!dexContract,
        oracleTokenContract: !!oracleTokenContract,
        oracleLendContract: !!oracleLendContract,
        isConnected
      })

      if (!dexContract || !oracleTokenContract || !oracleLendContract || !isConnected) {
        console.log('❌ Missing contracts or not connected')
        setDataLoading(false)
        return
      }

      try {
        setDataLoading(true)
        console.log('📊 Getting DEX reserves...')

        // Get DEX reserves with error handling
        let dexTTrust = 0
        let dexOracle = 0
        
        try {
          const tTrustReserve = await dexContract.tTrustReserve()
          const oracleReserve = await dexContract.oracleReserve()
          
          dexTTrust = Number(tTrustReserve) / 1e18
          dexOracle = Number(oracleReserve) / 1e18
          
          console.log('✅ DEX reserves:', { dexTTrust, dexOracle })
        } catch (dexError) {
          console.error('❌ DEX reserves error:', dexError)
        }

        // Get lending protocol balances
        let lendingTTrust = 0
        let lendingOracle = 0
        
        try {
          const ethBalance = await oracleLendContract.getContractETHBalance()
          const oracleBalance = await oracleLendContract.getContractOracleBalance()
          
          lendingTTrust = Number(ethBalance) / 1e18
          lendingOracle = Number(oracleBalance) / 1e18
          
          console.log('✅ Lending balances:', { lendingTTrust, lendingOracle })
        } catch (lendingError) {
          console.error('❌ Lending balances error:', lendingError)
        }

        // Calculate totals
        const totalTTrust = dexTTrust + lendingTTrust
        const totalOracle = dexOracle + lendingOracle
        
        console.log('📈 Totals:', { totalTTrust, totalOracle })

        // Get current price for USD calculation
        let currentPrice = 500000 // Default fallback
        try {
          const price = await oracleLendContract.getCurrentPrice()
          currentPrice = Number(price) / 1e18
          console.log('💰 Current price:', currentPrice, 'ORACLE per TTRUST')
        } catch (priceError) {
          console.error('❌ Price error:', priceError)
        }

        // Calculate USD value (approximate)
        const ttrust_usd_price = 2500 // Approximate TTRUST price in USD
        const oracle_usd_price = ttrust_usd_price / currentPrice // ORACLE price in USD
        const totalUSD = (totalTTrust * ttrust_usd_price + totalOracle * oracle_usd_price)

        const newData = {
          totalTVL: {
            tTRUST: totalTTrust.toFixed(2),
            ORACLE: totalOracle.toFixed(0),
            usd: totalUSD.toFixed(2)
          },
          totalTransactions: 0, // Would need event tracking
          volume24h: '0', // Would need event tracking  
          dexReserves: {
            tTRUST: dexTTrust.toFixed(2),
            ORACLE: dexOracle.toFixed(0)
          },
          lendingStats: {
            totalCollateral: lendingTTrust.toFixed(2),
            totalBorrowed: '0', // Would need tracking
            oracleBalance: lendingOracle.toFixed(0)
          }
        }

        console.log('✅ Final analytics data:', newData)
        setRealTimeData(newData)

      } catch (error) {
        console.error('❌ Error fetching real-time data:', error)
      } finally {
        setDataLoading(false)
      }
    }

    fetchRealTimeData()
    
    // Update every 30 seconds
    const interval = setInterval(fetchRealTimeData, 30000)
    return () => clearInterval(interval)
    
  }, [dexContract, oracleTokenContract, oracleLendContract, isConnected])

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const formatCurrency = (value: string, decimals: number = 2) => {
    return parseFloat(value).toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    })
  }

  const formatInteger = (value: string) => {
    return parseInt(parseFloat(value).toString()).toLocaleString()
  }

  const formatSmartPrecision = (value: string | number, significantDigits: number = 3) => {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (num === 0) return '0'
    
    // For very small numbers, use significant digits after first non-zero
    if (Math.abs(num) < 1) {
      // Find the position of the first non-zero digit after decimal
      const str = num.toExponential()
      const [mantissa, exponent] = str.split('e')
      const exp = parseInt(exponent)
      
      if (exp < 0) {
        // Calculate decimal places needed for 3 significant digits
        const decimalPlaces = Math.abs(exp) + significantDigits - 1
        return num.toFixed(decimalPlaces)
      }
    }
    
    // For larger numbers, use regular precision
    if (Math.abs(num) >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (Math.abs(num) >= 1000) {
      return (num / 1000).toFixed(1) + 'K'  
    }
    if (Math.abs(num) >= 1) {
      return num.toFixed(2)
    }
    
    return num.toString()
  }

  // Calculate current price for display
  const currentPriceNum = parseFloat(protocolStats.currentPrice) / 1e18 || 0
  const currentPriceFormatted = formatNumber(currentPriceNum)

  const mainMetrics = [
    {
      title: 'Current Price',
      value: `1 TTRUST = ${formatCurrency(currentPriceNum.toString())} ORACLE`,
      change: null,
      icon: 'fas fa-chart-line',
      color: 'text-green-400',
      subtitle: `1 ORACLE = ${formatSmartPrecision(1 / currentPriceNum)} TTRUST`
    },
    {
      title: 'DEX Liquidity',
      value: `${formatCurrency(realTimeData.dexReserves.tTRUST)} TTRUST`,
      change: null,
      icon: 'fas fa-exchange-alt',
      color: 'text-blue-400',
      subtitle: `${formatInteger(realTimeData.dexReserves.ORACLE)} ORACLE`
    },
    {
      title: 'Lending Protocol',
      value: `${formatCurrency(realTimeData.lendingStats.totalCollateral)} TTRUST`,
      change: null,
      icon: 'fas fa-university',
      color: 'text-purple-400',
      subtitle: `${formatInteger(realTimeData.lendingStats.oracleBalance)} ORACLE`
    }
  ]

  const protocolStatsData = [
    {
      category: 'Lending Protocol',
      stats: [
        { label: 'TTRUST Collateral', value: `${formatCurrency(realTimeData.lendingStats.totalCollateral)} TTRUST`, icon: '⚡' },
        { label: 'ORACLE Available', value: `${formatInteger(realTimeData.lendingStats.oracleBalance)} ORACLE`, icon: <TokenIcon token="ORACLE" size="sm" /> },
        { label: 'Current Price', value: `${formatNumber(parseFloat(protocolStats.currentPrice) / 1e18)} ORACLE/TTRUST`, icon: '💰' },
        { label: 'Collateral Ratio', value: '120%', icon: '🛡️' }
      ]
    },
    {
      category: 'DEX Analytics',
      stats: [
        { label: 'TTRUST Reserve', value: `${formatCurrency(realTimeData.dexReserves.tTRUST)} TTRUST`, icon: '⚡' },
        { label: 'ORACLE Reserve', value: `${formatInteger(realTimeData.dexReserves.ORACLE)} ORACLE`, icon: <TokenIcon token="ORACLE" size="sm" /> },
        { label: 'LP Token Supply', value: 'N/A', icon: '🔄' },
        { label: 'Pool Health', value: 'Active', icon: '✅' }
      ]
    }
  ]



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold glassmorphism-text-gradient mb-4">Protocol Analytics</h1>
        <p className="text-gray-400 text-lg">Real-time data from Oracle Lend Protocol</p>
        
        {/* Debug Status */}
        <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-sm">
          <div className="flex items-center justify-center space-x-4 text-gray-400">
            <span className={`flex items-center ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className={`flex items-center ${dexContract ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${dexContract ? 'bg-green-400' : 'bg-red-400'}`}></div>
              DEX Contract
            </span>
            <span className={`flex items-center ${oracleLendContract ? 'text-green-400' : 'text-red-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${oracleLendContract ? 'bg-green-400' : 'bg-red-400'}`}></div>
              Lending Contract
            </span>
            <span className={`flex items-center ${dataLoading ? 'text-yellow-400' : 'text-gray-400'}`}>
              {dataLoading && <div className="w-2 h-2 rounded-full mr-2 bg-yellow-400 animate-pulse"></div>}
              {dataLoading ? 'Loading...' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mainMetrics.map((metric, index) => (
          <div key={index} className="glassmorphism-tier-mythic rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} bg-opacity-20 flex items-center justify-center`}>
                <i className={`${metric.icon} ${metric.color} text-xl`}></i>
              </div>
              {metric.change && <span className="text-green-400 text-sm font-medium">{metric.change}</span>}
            </div>
            <h3 className="text-gray-400 text-sm mb-2">{metric.title}</h3>
            <p className="text-xl font-bold text-white mb-2">
              {dataLoading ? (
                <div className="animate-pulse bg-gray-700 h-6 w-32 rounded"></div>
              ) : (
                metric.value
              )}
            </p>
            <p className="text-xl font-bold text-gray-300">{metric.subtitle}</p>
          </div>
        ))}
      </div>


  

      {/* Protocol Information */}
      <div className="glassmorphism-card rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fas fa-info-circle text-blue-400 mr-3"></i>
          Protocol Overview
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">🏦 Lending Protocol</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Over-collateralized lending (120% ratio)</li>
              <li>• TTRUST as collateral, ORACLE as borrowable asset</li>
              <li>• 10% liquidation bonus for liquidators</li>
              <li>• Real-time price discovery via DEX</li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">🔄 DEX (AMM)</h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Constant product formula (x * y = k)</li>
              <li>• TTRUST/ORACLE trading pair</li>
              <li>• Serves as price oracle for lending</li>
              <li>• Native TTRUST integration</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Discord Link */}
      <div className="text-center py-8">
        <a 
          href="https://discord.com/invite/0xintuition" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-3 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-indigo-500/25 hover:animate-button-pulse"
        >
          <i className="fab fa-discord text-xl"></i>
          <span>Join Intuition Discord</span>
          <i className="fas fa-external-link-alt text-sm opacity-75"></i>
        </a>
      </div>
    </div>
  )
}

export default Analytics
