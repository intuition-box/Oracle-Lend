"use client";

import React from "react";
import { SpaceCard, DeFiMetrics, TokenBadges } from "~~/components/SpaceCard";
import "~~/styles/space-preview.css";

const SpacePreview = () => {
  return (
    <div className="space-theme">
      <div className="min-h-screen space-background relative overflow-hidden">
        
        {/* Header avec navigation retour */}
        <nav className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <a 
              href="/" 
              className="flex items-center space-x-2 text-white hover:text-cyan-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Retour à l'accueil</span>
            </a>
            <div className="text-cyan-400 font-semibold">
              🚀 Aperçu Thème Spatial
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative z-10 text-center py-20 px-4">
          <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-6">
            Oracle Lend
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4 font-light">
            Naviguez dans l'univers DeFi
          </p>
          <p className="text-lg text-gray-400 mb-12">
            Prêtez et empruntez à travers les galaxies 🌌
          </p>
          
          {/* Stats globales */}
          <div className="flex flex-wrap justify-center gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">$2.4B</div>
              <div className="text-sm text-gray-400">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-1">12.5%</div>
              <div className="text-sm text-gray-400">Rendement Moyen</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400 mb-1">50K+</div>
              <div className="text-sm text-gray-400">Utilisateurs Actifs</div>
            </div>
          </div>
        </div>

        {/* Cards Section */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card Lending Pool */}
            <SpaceCard
              title="Liquidity Pools"
              subtitle="Fournissez de la liquidité et gagnez des récompenses"
              iconType="planet"
              badge={{ text: "Actif", type: "active" }}
              value="15.8%"
            >
              <DeFiMetrics 
                apy={15.8}
                tvl="$420M"
                utilization={67}
              />
              <div className="mt-4">
                <TokenBadges tokens={['ETH', 'USDC', 'DAI']} />
              </div>
            </SpaceCard>

            {/* Card Borrow Markets */}
            <SpaceCard
              title="Borrow Markets"
              subtitle="Empruntez des actifs avec des taux compétitifs"
              iconType="constellation"
              badge={{ text: "Disponible", type: "active" }}
              value="3.2%"
            >
              <DeFiMetrics 
                apy={3.2}
                tvl="$180M"
                utilization={45}
              />
              <div className="mt-4">
                <TokenBadges tokens={['USDT', 'WBTC', 'ETH']} />
              </div>
            </SpaceCard>

            {/* Card Governance */}
            <SpaceCard
              title="Governance"
              subtitle="Participez à la gouvernance du protocole"
              iconType="galaxy"
              badge={{ text: "Nouveau", type: "pending" }}
              value="42"
            >
              <div className="space-y-4 text-center">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Propositions Actives</div>
                  <div className="text-2xl font-bold text-white">3</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Voting Power</div>
                  <div className="text-xl font-semibold text-purple-400">1,247 ORL</div>
                </div>
                <div className="pt-2">
                  <button className="neon-button w-full">
                    <span>Voter Maintenant</span>
                  </button>
                </div>
              </div>
            </SpaceCard>

            {/* Card Portfolio */}
            <SpaceCard
              title="Mon Portfolio"
              subtitle="Vue d'ensemble de vos positions"
              iconType="planet"
              badge={{ text: "Connecté", type: "active" }}
              className="md:col-span-2 lg:col-span-1"
            >
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Valeur Totale</span>
                  <span className="text-white font-bold">$12,450</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">P&L 24h</span>
                  <span className="text-green-400 font-bold">+$234 (+1.9%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Positions</span>
                  <span className="text-white">5 actives</span>
                </div>
              </div>
            </SpaceCard>

            {/* Card Analytics */}
            <SpaceCard
              title="Market Analytics"
              subtitle="Tendances du marché en temps réel"
              iconType="constellation"
              badge={{ text: "Live", type: "active" }}
              className="md:col-span-2"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400 mb-1">↗ 23%</div>
                  <div className="text-sm text-gray-400">Volume 24h</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">₿ 0.067</div>
                  <div className="text-sm text-gray-400">ETH/BTC Ratio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">🔥 High</div>
                  <div className="text-sm text-gray-400">Volatilité</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">✨ Bullish</div>
                  <div className="text-sm text-gray-400">Sentiment</div>
                </div>
              </div>
            </SpaceCard>

          </div>
        </div>

        {/* Footer avec infos techniques */}
        <div className="relative z-10 text-center py-12 px-4 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-4">
              🎨 Aperçu du Nouveau Design Spatial
            </h3>
            <p className="text-gray-400 mb-6">
              Ce preview démontre le potentiel visuel du thème spatial pour votre DApp Oracle Lend.
              Les animations, gradients et effets glassmorphism créent une expérience immersive.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                <div className="text-cyan-400 font-semibold mb-2">🌟 Animations</div>
                <p className="text-gray-400">
                  Étoiles défilantes, rotation des planètes, particules flottantes
                </p>
              </div>
              <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                <div className="text-purple-400 font-semibold mb-2">🪟 Glassmorphism</div>
                <p className="text-gray-400">
                  Effet de verre avec flou d'arrière-plan et transparence
                </p>
              </div>
              <div className="bg-black/20 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                <div className="text-pink-400 font-semibold mb-2">🎨 Palette Cosmique</div>
                <p className="text-gray-400">
                  Couleurs inspirées des nébuleuses et des aurores boréales
                </p>
              </div>
            </div>

            <div className="mt-8">
              <button className="neon-button mr-4">
                <span>J'aime ce style !</span>
              </button>
              <a 
                href="/"
                className="px-8 py-3 border border-white/30 rounded-full text-white hover:bg-white/10 transition-all"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpacePreview;