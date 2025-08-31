import React from 'react'
import { Link } from 'react-router-dom'
import { PROTOCOL_CONFIG, TOKENS } from '../utils/constants'
import TokenIcon from './TokenIcon'

const Dashboard: React.FC = () => {
  const features = [
    {
      title: 'Lending & Borrowing',
      description: 'Supply assets to earn interest or borrow against your collateral with competitive rates.',
      icon: 'fas fa-coins',
      link: '/lending',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      title: 'Token Swap',
      description: 'Swap between tTRUST and ORACLE tokens with minimal slippage and low fees.',
      icon: 'fas fa-exchange-alt',
      link: '/dex',
      gradient: 'from-blue-500 to-cyan-600'
    }
  ]

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className="glass-effect rounded-xl p-4 sm:p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300 group"
          >
            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <i className={`${feature.icon} text-white text-xl sm:text-2xl`}></i>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 group-hover:text-purple-300 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">
              {feature.description}
            </p>
            <div className="mt-4 flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
              <span className="text-sm font-medium">Learn more</span>
              <i className="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </Link>
        ))}
      </div>

      {/* Token Supply Information */}
      <div className="glass-effect rounded-xl p-4 sm:p-6 border border-gray-700/50">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
          <i className="fas fa-coins text-green-400 mr-3"></i>
          Token Supply
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-gray-800/50 rounded-lg p-4 sm:p-6 border border-gray-600/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-600 flex items-center justify-center">
                  <TokenIcon token="ORACLE" size="lg" className="text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">{TOKENS.ORACLE.symbol}</h3>
                  <p className="text-xs sm:text-sm text-gray-400">{TOKENS.ORACLE.name}</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">{parseInt(PROTOCOL_CONFIG.tokenSupply.ORACLE).toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">Total Supply</p>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>Contract: {TOKENS.ORACLE.address}</p>
            </div>
          </div>
          

        </div>
      </div>

      {/* Protocol Information */}
      <div className="glass-effect rounded-xl p-4 sm:p-6 border border-gray-700/50">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6 flex items-center">
          <i className="fas fa-network-wired text-cyan-400 mr-3"></i>
          Network Information
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <i className="fas fa-link text-cyan-400"></i>
            </div>
            <h4 className="text-sm sm:text-base font-medium text-white mb-1">Chain ID</h4>
            <p className="text-xs sm:text-sm text-gray-400">13579</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-green-500/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <i className="fas fa-coins text-green-400"></i>
            </div>
            <h4 className="text-sm sm:text-base font-medium text-white mb-1">Native Token</h4>
            <p className="text-xs sm:text-sm text-gray-400">$tTRUST</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <i className="fas fa-database text-purple-400"></i>
            </div>
            <h4 className="text-sm sm:text-base font-medium text-white mb-1">Data Availability</h4>
            <p className="text-xs sm:text-sm text-gray-400">Arbitrum AnyTrust</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-orange-500/20 flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <i className="fas fa-layer-group text-orange-400"></i>
            </div>
            <h4 className="text-sm sm:text-base font-medium text-white mb-1">Settlement Layer</h4>
            <p className="text-xs sm:text-sm text-gray-400">Base Sepolia</p>
          </div>
        </div>
      </div>

      {/* Discord Link */}
      <div className="text-center py-8">
        <a 
          href="https://discord.com/invite/0xintuition" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-indigo-500/25 min-h-[44px]"
        >
          <i className="fab fa-discord text-xl"></i>
          <span>Join Intuition Discord</span>
          <i className="fas fa-external-link-alt text-sm opacity-75"></i>
        </a>
      </div>
    </div>
  )
}

export default Dashboard
