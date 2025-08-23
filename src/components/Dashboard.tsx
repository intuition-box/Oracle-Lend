import React from 'react'
import { Link } from 'react-router-dom'

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
      title: 'Decentralized Exchange',
      description: 'Swap between tTRUST and ORACLE tokens with minimal slippage and low fees.',
      icon: 'fas fa-exchange-alt',
      link: '/dex',
      gradient: 'from-blue-500 to-cyan-600'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Exchange Rate Info */}
      <div className="glass-effect rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-center">
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-center space-x-3">
              <i className="fas fa-info-circle text-blue-400"></i>
              <div>
                <h4 className="text-blue-300 font-medium">Exchange Rate</h4>
                <p className="text-sm text-gray-300">1 tTRUST = 100 ORACLE</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
