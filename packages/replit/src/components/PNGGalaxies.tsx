import React from 'react';

interface Galaxy {
  name: string;
  x: string;
  y: string;
  scale: number;
  rotationSpeed: number; // secondes pour rotation complète
  zIndex: number;
  bestFrame: string; // Meilleure frame à utiliser (ex: "045")
}

const PNGGalaxies: React.FC = () => {
  
  // Configuration des 3 galaxies PNG - ROTATION CSS FLUIDE
  const galaxies: Galaxy[] = [
    {
      name: 'main',
      x: '62%',
      y: '45%',
      scale: 1200, // ZOOM x4.8 - ÉNORME et spectaculaire (était 750)
      rotationSpeed: -60, // 60 secondes par rotation - sens spirales
      zIndex: 3,
      bestFrame: '045' // Meilleure frame pour les bras spiraux
    },
    {
      name: 'secondary',
      x: '20%',
      y: '70%',
      scale: 900, // ZOOM x5 proportionnel - TRÈS GRAND (était 540)
      rotationSpeed: -45, // 45 secondes - plus rapide
      zIndex: 2,
      bestFrame: '000' // Frame classique face-on
    },
    {
      name: 'third',
      x: '85%',
      y: '80%',
      scale: 750, // ZOOM x5 proportionnel - MASSIF (était 450)
      rotationSpeed: -30, // 30 secondes - le plus rapide
      zIndex: 1,
      bestFrame: '090' // Perspective intéressante
    }
  ];


  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 10 }}>
      {galaxies.map((galaxy) => {        
        return (
          <div
            key={galaxy.name}
            className="absolute"
            style={{
              left: galaxy.x,
              top: galaxy.y,
              transform: `translate(-50%, -50%)`,
              zIndex: galaxy.zIndex,
              width: `${galaxy.scale}px`,
              height: `${galaxy.scale}px`,
              animation: `rotateGalaxy ${Math.abs(galaxy.rotationSpeed)}s linear infinite ${galaxy.rotationSpeed < 0 ? 'reverse' : 'normal'}`,
            }}
          >
            <img
              src={`/galaxies/galaxy-${galaxy.name}-${galaxy.bestFrame}.png`}
              alt={`${galaxy.name} galaxy`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'hue-rotate(20deg) saturate(1.2) brightness(1.1) drop-shadow(0 0 25px rgba(138, 43, 226, 0.5)) drop-shadow(0 0 8px rgba(138, 43, 226, 0.3))'
              }}
              onError={(e) => {
                // Fallback vers la frame 000 si l'image ne charge pas
                const target = e.target as HTMLImageElement;
                target.src = `/galaxies/galaxy-${galaxy.name}-000.png`;
              }}
            />
          </div>
        );
      })}
      
      {/* Animation CSS fluide pour toutes les galaxies */}
      <style>{`
        @keyframes rotateGalaxy {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PNGGalaxies;