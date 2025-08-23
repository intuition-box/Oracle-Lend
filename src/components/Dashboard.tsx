import React from 'react'
import { Link } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'

const Dashboard: React.FC = () => {
  const { analytics, isLoading } = useAnalytics()

  const quickStats = [
    {
      title: 'Total TVL',
      value: `$${parseFloat(analytics.totalTVL.usd).toLocaleString()}`,
      change: '+12.5%',
      icon: 'fas fa-lock',
      color: 'text-green-400'
    },
    {
      title: 'Total Transactions',
      value: analytics.totalTransactions.toLocaleString(),
      change: '+8.3%',
      icon: 'fas fa-exchange-alt',
      color: 'text-blue-400'
    },
    {
      title: 'Unique Wallets',
      value: analytics.uniqueWallets.toLocaleString(),
      change: '+15.7%',
      icon: 'fas fa-users',
      color: 'text-purple-400'
    },
    {
      title: '24h Volume',
      value: `$${parseFloat(analytics.volume24h).toLocaleString()}`,
      change: '+4.2%',
      icon: 'fas fa-chart-line',
      color: 'text-yellow-400'
    }
  ]

  const features = [
    {
      title: 'Lending & Borrowing',
      description: 'Supply assets to earn interest or borrow against your collateral with competitive rates.',
      icon: 'fas fa-coins',
      link: '/lending',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Decentralized Exchange',
      description: 'Swap between tTRUST and ORACLE tokens with minimal slippage and low fees.',
      icon: 'fas fa-exchange-alt',
      link: '/dex',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      title: 'Real-time Analytics',
      description: 'Monitor protocol metrics, transaction volumes, and market data in real-time.',
      icon: 'fas fa-chart-line',
      link: '/analytics',
      gradient: 'from-purple-500 to-pink-600'
    }
  ]

  const tokenPrices = [
    {
      symbol: 'tTRUST',
      name: 'Intuition Trust Token',
      price: '$2,500.00',
      change: '+2.34%',
      tvl: analytics.totalTVL.tTRUST,
      icon: '⚡'
    },
    {
      symbol: 'ORACLE',
      name: 'Oracle Token',
      price: '$25.00',
      change: '+1.89%',
      tvl: analytics.totalTVL.ORACLE,
      icon: '🔮'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div key={index} className="glass-effect rounded-xl p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} bg-opacity-20 flex items-center justify-center`}>
                <i className={`${stat.icon} ${stat.color} text-xl`}></i>
              </div>
              <span className="text-green-400 text-sm font-medium">{stat.change}</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-white">
              {isLoading ? (
                <div className="animate-pulse bg-gray-700 h-8 w-24 rounded"></div>
              ) : (
                stat.value
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Token Prices */}
      <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fas fa-coins text-yellow-400 mr-3"></i>
          Token Prices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tokenPrices.map((token, index) => (
            <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{token.icon}</span>
                  <div>
                    <h3 className="text-lg font-bold text-white">{token.symbol}</h3>
                    <p className="text-sm text-gray-400">{token.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{token.price}</p>
                  <p className="text-sm text-green-400">{token.change}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">TVL:</span>
                <span className="text-white">{parseFloat(token.tvl).toLocaleString()} {token.symbol}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-center space-x-3">
            <i className="fas fa-info-circle text-blue-400"></i>
            <div>
              <h4 className="text-blue-300 font-medium">Exchange Rate</h4>
              <p className="text-sm text-gray-300">1 tTRUST = 100 ORACLE</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className="glass-effect rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group"
          >
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <i className={`${feature.icon} text-white text-2xl`}></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
              {feature.title}
            </h3>
            <p className="text-gray-400 group-hover:text-gray-300 transition-colors">
              {feature.description}
            </p>
            <div className="mt-4 flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
              <span className="text-sm font-medium">Learn more</span>
              <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </Link>
        ))}
      </div>

      {/* Protocol Information */}
      <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <i className="fas fa-network-wired text-cyan-400 mr-3"></i>
          Protocol Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-link text-cyan-400"></i>
            </div>
            <h4 className="font-medium text-white mb-1">Chain ID</h4>
            <p className="text-gray-400">13579</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-coins text-green-400"></i>
            </div>
            <h4 className="font-medium text-white mb-1">Native Token</h4>
            <p className="text-gray-400">$tTRUST</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-database text-purple-400"></i>
            </div>
            <h4 className="font-medium text-white mb-1">Data Availability</h4>
            <p className="text-gray-400">Arbitrum AnyTrust</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mx-auto mb-3">
              <i className="fas fa-layer-group text-orange-400"></i>
            </div>
            <h4 className="font-medium text-white mb-1">Settlement Layer</h4>
            <p className="text-gray-400">Base Sepolia</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
