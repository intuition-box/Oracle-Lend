import React from 'react';

interface Galaxy {
  name: string;
  x: string;
  y: string;
  scale: number;
  rotationSpeed: number; // seconds for complete rotation
  zIndex: number;
  bestFrame: string; // Best frame to use (e.g., "045")
}

const PNGGalaxies: React.FC = () => {
  
  // Configuration of 3 PNG galaxies - SMOOTH CSS ROTATION
  const galaxies: Galaxy[] = [
    {
      name: 'main',
      x: '62%',
      y: '45%',
      scale: 1200, // ZOOM x4.8 - HUGE and spectacular (was 750)
      rotationSpeed: -60, // 60 seconds per rotation - spiral direction
      zIndex: 3,
      bestFrame: '045' // Best frame for spiral arms
    },
    {
      name: 'secondary',
      x: '20%',
      y: '70%',
      scale: 900, // ZOOM x5 proportional - VERY LARGE (was 540)
      rotationSpeed: -45, // 45 seconds - faster
      zIndex: 2,
      bestFrame: '000' // Frame classique face-on
    },
    {
      name: 'third',
      x: '85%',
      y: '80%',
      scale: 750, // ZOOM x5 proportional - MASSIVE (was 450)
      rotationSpeed: -30, // 30 seconds - fastest
      zIndex: 1,
      bestFrame: '090' // Interesting perspective
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
                // Fallback to frame 000 if image doesn't load
                const target = e.target as HTMLImageElement;
                target.src = `/galaxies/galaxy-${galaxy.name}-000.png`;
              }}
            />
          </div>
        );
      })}
      
      {/* Smooth CSS animation for all galaxies */}
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