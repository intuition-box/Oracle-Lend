import React, { useState } from 'react'
import { useAnalytics } from '../hooks/useAnalytics'
import TokenIcon from './TokenIcon'

const Analytics: React.FC = () => {
  const { analytics, isLoading, refreshAnalytics } = useAnalytics()
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h')

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

  const mainMetrics = [
    {
      title: 'Total Value Locked (TVL)',
      value: `$${formatCurrency(analytics.totalTVL.usd)}`,
      change: null,
      icon: 'fas fa-lock',
      color: 'text-green-400',
      subtitle: `${formatCurrency(analytics.totalTVL.tTRUST)} tTRUST + ${formatCurrency(analytics.totalTVL.ORACLE)} ORACLE + ${formatCurrency(analytics.totalTVL.INTUIT)} INTUIT`
    },
    {
      title: 'Total Transactions',
      value: formatNumber(analytics.totalTransactions),
      change: null,
      icon: 'fas fa-exchange-alt',
      color: 'text-blue-400',
      subtitle: 'All-time protocol transactions'
    },
    {
      title: 'Unique Wallets',
      value: formatNumber(analytics.uniqueWallets),
      change: null,
      icon: 'fas fa-users',
      color: 'text-purple-400',
      subtitle: 'Active protocol users'
    },
    {
      title: '24h Volume',
      value: `${formatCurrency(analytics.volume24h)} TTRUST`,
      change: null,
      icon: 'fas fa-chart-line',
      color: 'text-yellow-400',
      subtitle: 'Trading + lending volume'
    }
  ]

  const protocolStats = [
    {
      category: 'Lending Pools',
      stats: [
        { label: 'tTRUST Pool Size', value: `${formatCurrency(analytics.totalTVL.tTRUST)} tTRUST`, icon: '⚡' },
        { label: 'ORACLE Pool Size', value: `${formatCurrency(analytics.totalTVL.ORACLE)} ORACLE`, icon: <TokenIcon token="ORACLE" size="sm" /> },
        { label: 'INTUIT Pool Size', value: `${formatCurrency(analytics.totalTVL.INTUIT)} INTUIT`, icon: '💎' },
        { label: 'Total Borrowed', value: `$${formatCurrency(analytics.totalBorrowed)}`, icon: 'fas fa-arrow-down' }
      ]
    },
    {
      category: 'Swap Analytics',
      stats: [
        { label: 'Daily Swaps', value: formatNumber(analytics.dailySwaps), icon: 'fas fa-exchange-alt' },
        { label: 'Swap Volume (24h)', value: `$${formatCurrency(analytics.swapVolume24h)}`, icon: 'fas fa-dollar-sign' },
        { label: 'Total Swaps', value: formatNumber(analytics.totalSwaps), icon: 'fas fa-exchange-alt' },
        { label: 'Avg Trade Size', value: `$${formatCurrency(analytics.avgTradeSize)}`, icon: 'fas fa-chart-area' }
      ]
    },
    {
      category: 'Network Activity',
      stats: [
        { label: 'Active Lenders', value: formatNumber(analytics.activeLenders), icon: 'fas fa-plus-circle' },
        { label: 'Active Borrowers', value: formatNumber(analytics.activeBorrowers), icon: 'fas fa-minus-circle' },
        { label: 'New Users (24h)', value: formatNumber(analytics.newUsers24h), icon: 'fas fa-user-plus' },
        { label: 'Active Users (24h)', value: formatNumber(analytics.activeUsers24h), icon: 'fas fa-user' }
      ]
    }
  ]

  // Use real chart data from analytics
  const getChartData = () => {
    const data = analytics.chartData || []
    return data.map(point => ({
      timestamp: point.timestamp,
      value: parseFloat(point.value),
      formatted: new Date(point.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        ...(timeframe !== '24h' && { month: 'short', day: 'numeric' })
      })
    }))
  }

  const chartData = getChartData()
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 1000000
  const minValue = chartData.length > 0 ? Math.min(...chartData.map(d => d.value)) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold gradient-text mb-4">My activity</h1>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainMetrics.map((metric, index) => (
          <div key={index} className="glass-effect rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${metric.color} bg-opacity-20 flex items-center justify-center`}>
                <i className={`${metric.icon} ${metric.color} text-xl`}></i>
              </div>
              {metric.change && <span className="text-green-400 text-sm font-medium">{metric.change}</span>}
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{metric.title}</h3>
            <p className="text-2xl font-bold text-white mb-1">
              {isLoading ? (
                <div className="animate-pulse bg-gray-700 h-8 w-24 rounded"></div>
              ) : (
                metric.value
              )}
            </p>
            <p className="text-xs text-gray-500">{metric.subtitle}</p>
          </div>
        ))}
      </div>


      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {protocolStats.map((section, sectionIndex) => (
          <div key={sectionIndex} className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <div className="w-2 h-2 rounded-full bg-purple-400 mr-3"></div>
              {section.category}
            </h3>
            <div className="space-y-4">
              {section.stats.map((stat, statIndex) => (
                <div key={statIndex} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    {typeof stat.icon === 'string' && stat.icon.startsWith('fas') ? (
                      <div className="w-8 h-8 rounded-lg bg-gray-700/50 flex items-center justify-center">
                        <i className={`${stat.icon} text-gray-400 text-sm`}></i>
                      </div>
                    ) : (
                      <span className="text-xl">{stat.icon}</span>
                    )}
                    <span className="text-gray-300 text-sm">{stat.label}</span>
                  </div>
                  <span className="text-white font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Live Activity Feed */}
      <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fas fa-rss text-orange-400 mr-3"></i>
          Live Activity Feed
          <div className="ml-3 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        </h2>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {(analytics.recentTransactions || []).map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center`}>
                  <i className={`${activity.icon} ${activity.color} text-sm`}></i>
                </div>
                <div>
                  <p className="text-white text-sm">
                    <span className="text-gray-400">User</span> {activity.user} 
                    <span className="text-gray-400 ml-1">
                      {activity.type === 'supply' ? 'supplied' :
                       activity.type === 'withdraw' ? 'withdrew' :
                       activity.type === 'borrow' ? 'borrowed' :
                       activity.type === 'repay' ? 'repaid' :
                       'swapped'}
                    </span> {activity.amount}
                  </p>
                  <p className="text-gray-500 text-xs">{activity.time}</p>
                </div>
              </div>
              <button 
                onClick={() => window.open(`https://explorer.intuition.network/tx/${activity.txHash}`, '_blank')}
                className="text-gray-500 hover:text-gray-400 transition-colors"
                title="View on block explorer"
              >
                <i className="fas fa-external-link-alt text-xs"></i>
              </button>
            </div>
          ))}
          {(!analytics.recentTransactions || analytics.recentTransactions.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-400">No recent transactions</p>
              <p className="text-gray-500 text-sm mt-1">Activity will appear here as users interact with the protocol</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-center">
          <button className="text-purple-400 hover:text-purple-300 text-sm font-medium">
            View All Transactions
            <i className="fas fa-arrow-right ml-1"></i>
          </button>
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
    </div>
  )
}

export default Analytics
