"use client";

import React from "react";

interface SpaceCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  badge?: {
    text: string;
    type: "active" | "pending";
  };
  iconType: "planet" | "constellation" | "galaxy";
  gradient?: "nebula" | "aurora" | "solar";
  children?: React.ReactNode;
  className?: string;
}

export const SpaceCard: React.FC<SpaceCardProps> = ({
  title,
  subtitle,
  value,
  badge,
  iconType,
  gradient = "nebula",
  children,
  className = "",
}) => {
  const renderIcon = () => {
    switch (iconType) {
      case "planet":
        return <div className="planet-icon"></div>;
        
      case "constellation":
        return (
          <div className="constellation-icon">
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
          </div>
        );
        
      case "galaxy":
        return (
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full blur-sm opacity-60 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 w-full h-full rounded-full">
              <div className="absolute inset-2 bg-gradient-to-tr from-transparent via-white/20 to-transparent rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white/30 rounded-full blur-sm"></div>
            </div>
          </div>
        );
        
      default:
        return <div className="planet-icon"></div>;
    }
  };

  return (
    <div className={`cosmic-card ${className}`}>
      {/* Icône */}
      {renderIcon()}

      {/* Badge de statut */}
      {badge && (
        <div className={`status-badge ${badge.type} mb-4`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${badge.type === 'active' ? 'bg-green-400' : 'bg-orange-400'} animate-pulse`}></div>
          {badge.text}
        </div>
      )}

      {/* Titre */}
      <h3 className="text-2xl font-bold text-white mb-2 text-center">
        {title}
      </h3>

      {/* Sous-titre */}
      {subtitle && (
        <p className="text-gray-400 text-center mb-4">
          {subtitle}
        </p>
      )}

      {/* Valeur métrique */}
      {value && (
        <div className="text-center mb-6">
          <div className="metric-value gradient-text">
            {value}
          </div>
        </div>
      )}

      {/* Contenu personnalisé */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}

      {/* Bouton d'action par défaut */}
      <div className="text-center mt-6">
        <button className="neon-button">
          <span>Explorer</span>
        </button>
      </div>

      {/* Particules flottantes */}
      <div className="floating-particle" style={{left: '10%', animationDelay: '0s'}}></div>
      <div className="floating-particle" style={{left: '30%', animationDelay: '2s'}}></div>
      <div className="floating-particle" style={{left: '60%', animationDelay: '4s'}}></div>
      <div className="floating-particle" style={{left: '80%', animationDelay: '6s'}}></div>
    </div>
  );
};

// Composant pour les métriques DeFi
interface DeFiMetricsProps {
  apy: number;
  tvl: string;
  utilization: number;
}

export const DeFiMetrics: React.FC<DeFiMetricsProps> = ({ apy, tvl, utilization }) => {
  return (
    <div className="space-y-4">
      {/* APY */}
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-sm">APY</span>
        <span className="text-green-400 font-bold">{apy}%</span>
      </div>

      {/* TVL */}
      <div className="flex justify-between items-center">
        <span className="text-gray-400 text-sm">TVL</span>
        <span className="text-white font-semibold">{tvl}</span>
      </div>

      {/* Utilisation avec barre de progression */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Utilisation</span>
          <span className="text-cyan-400 font-semibold">{utilization}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${utilization}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Composant pour les tokens supportés
interface TokenBadgesProps {
  tokens: string[];
}

export const TokenBadges: React.FC<TokenBadgesProps> = ({ tokens }) => {
  const getTokenColor = (token: string) => {
    const colors: { [key: string]: string } = {
      'ETH': 'from-blue-500 to-purple-500',
      'USDC': 'from-blue-400 to-cyan-400',
      'USDT': 'from-green-400 to-emerald-500',
      'DAI': 'from-yellow-400 to-orange-500',
      'WBTC': 'from-orange-500 to-red-500',
    };
    return colors[token] || 'from-gray-500 to-gray-600';
  };

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {tokens.map((token, index) => (
        <span
          key={index}
          className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getTokenColor(token)} text-white border border-white/20 backdrop-blur-sm`}
        >
          {token}
        </span>
      ))}
    </div>
  );
};