import React, { useRef, useEffect } from 'react';

interface Star {
  // Position polaire pour rotation différentielle
  angle: number;
  radius: number;
  // Position cartésienne calculée
  x: number;
  y: number;
  // Positions précédentes pour interpolation
  prevX: number;
  prevY: number;
  // Propriétés visuelles
  size: number;
  opacity: number;
  color: string;
  // Animation
  pulsePhase: number;
  // Vitesse de rotation individuelle (rotation différentielle)
  angularVelocity: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinklePhase: number;
}

interface Galaxy {
  centerX: number;
  centerY: number;
  baseRadius: number;
  rotationSpeed: number;
  armCount: number;
  stars: Star[];
  color: string;
  opacity: number;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const galaxiesRef = useRef<Galaxy[]>([]);
  const backgroundStarsRef = useRef<BackgroundStar[]>([]);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const smoothDeltaRef = useRef(1/60); // Lissage du deltaTime

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeGalaxies();
    };

    const createSpiral = (centerX: number, centerY: number, baseRadius: number, armCount: number, starCount: number, color: string, baseRotationSpeed: number): Star[] => {
      const stars: Star[] = [];
      
      for (let i = 0; i < starCount; i++) {
        // Créer une spirale logarithmique
        const t = (i / starCount) * Math.PI * 4; // 4 tours de spirale
        const spiralRadius = baseRadius * (0.2 + 0.8 * (i / starCount));
        
        // Ajouter de la variation pour chaque bras
        const armIndex = Math.floor(Math.random() * armCount);
        const armOffset = (armIndex * 2 * Math.PI) / armCount;
        
        // Position polaire avec variation aléatoire
        // Inverser l'angle si la rotation est négative pour que la spirale corresponde
        const angleMultiplier = baseRotationSpeed < 0 ? -1 : 1;
        const angle = angleMultiplier * (t + armOffset) + (Math.random() - 0.5) * 0.5;
        const radius = spiralRadius + (Math.random() - 0.5) * baseRadius * 0.2;
        
        // Rotation différentielle : les étoiles proches du centre tournent plus vite
        // Formule de Kepler simplifiée : v ∝ 1/√r
        const normalizedRadius = radius / baseRadius;
        const angularVelocity = baseRotationSpeed * (1 / Math.sqrt(0.2 + normalizedRadius * 0.8));
        
        // Position initiale
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        stars.push({
          angle,
          radius,
          x,
          y,
          prevX: x, // Initialiser les positions précédentes
          prevY: y,
          size: Math.random() * 2 + 0.5, // Étoiles plus petites et raffinées
          opacity: Math.random() * 0.4 + 0.6,
          color: color,
          pulsePhase: Math.random() * Math.PI * 2,
          angularVelocity
        });
      }
      
      return stars;
    };

    const initializeBackgroundStars = () => {
      backgroundStarsRef.current = [];
      const starCount = Math.floor((canvas.width * canvas.height) / 5000); // Densité d'étoiles de fond
      
      for (let i = 0; i < starCount; i++) {
        backgroundStarsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.2, // Très petites étoiles
          opacity: Math.random() * 0.8 + 0.2,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
    };

    const initializeGalaxies = () => {
      galaxiesRef.current = [];
      initializeBackgroundStars();
      
      // Galaxie principale - position décentrée pour dynamisme
      const mainGalaxyX = canvas.width * 0.6;
      const mainGalaxyY = canvas.height * 0.45;
      galaxiesRef.current.push({
        centerX: mainGalaxyX,
        centerY: mainGalaxyY,
        baseRadius: Math.min(canvas.width, canvas.height) * 0.22,
        rotationSpeed: 0.045, // Accéléré pour fluidité
        armCount: 4,
        stars: createSpiral(
          mainGalaxyX,
          mainGalaxyY,
          Math.min(canvas.width, canvas.height) * 0.22,
          4,
          300,
          '#ff6b35', // Orange chaud pour la galaxie principale
          0.045
        ),
        color: '#ff6b35', // Orange chaud
        opacity: 1.0
      });

      // Galaxie secondaire - coin supérieur gauche pour équilibre
      const secondGalaxyX = canvas.width * 0.25;
      const secondGalaxyY = canvas.height * 0.25;
      galaxiesRef.current.push({
        centerX: secondGalaxyX,
        centerY: secondGalaxyY,
        baseRadius: Math.min(canvas.width, canvas.height) * 0.12,
        rotationSpeed: -0.06, // Rotation inverse accélérée
        armCount: 3,
        stars: createSpiral(
          secondGalaxyX,
          secondGalaxyY,
          Math.min(canvas.width, canvas.height) * 0.12,
          3,
          200,
          '#ffd700', // Doré chaud
          -0.06
        ),
        color: '#ffd700', // Doré
        opacity: 0.9
      });

      // Galaxie lointaine - coin inférieur droit pour triangle harmonieux
      const thirdGalaxyX = canvas.width * 0.75;
      const thirdGalaxyY = canvas.height * 0.70;
      galaxiesRef.current.push({
        centerX: thirdGalaxyX,
        centerY: thirdGalaxyY,
        baseRadius: Math.min(canvas.width, canvas.height) * 0.10,
        rotationSpeed: 0.075, // La plus rapide, accélérée
        armCount: 2,
        stars: createSpiral(
          thirdGalaxyX,
          thirdGalaxyY,
          Math.min(canvas.width, canvas.height) * 0.10,
          2,
          100,
          '#ff9a56', // Pêche chaud
          0.075
        ),
        color: '#ff9a56', // Pêche
        opacity: 0.7
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    const animate = (currentTime: number) => {
      // Calcul du deltaTime avec lissage pour éviter les saccades
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const rawDeltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;
      
      // Lissage du deltaTime pour éviter les variations brusques
      const targetDelta = Math.min(rawDeltaTime, 1/30); // Cap à 30 FPS minimum
      smoothDeltaRef.current = smoothDeltaRef.current * 0.9 + targetDelta * 0.1;
      const deltaTime = smoothDeltaRef.current;
      
      timeRef.current += deltaTime;
      
      // Fond dégradé cosmique - noir profond avec tons chauds subtils
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, '#0a0604'); // Noir avec très légère teinte chaude
      gradient.addColorStop(0.5, '#040201'); // Noir profond
      gradient.addColorStop(1, '#000000'); // Noir pur
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dessiner les étoiles de fond statiques
      backgroundStarsRef.current.forEach((star) => {
        star.twinklePhase += deltaTime * 2; // Animation de scintillement
        const twinkle = 0.5 + 0.5 * Math.sin(star.twinklePhase);
        
        ctx.save();
        ctx.globalAlpha = star.opacity * twinkle;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      // Ajouter des nébuleuses colorées
      galaxiesRef.current.forEach((galaxy, index) => {
        ctx.save();
        
        // Nébuleuse de fond très subtile pour chaque galaxie
        const nebulaGradient = ctx.createRadialGradient(
          galaxy.centerX, galaxy.centerY, 0,
          galaxy.centerX, galaxy.centerY, galaxy.baseRadius * 1.5
        );
        nebulaGradient.addColorStop(0, galaxy.color + '10'); // Beaucoup plus subtil
        nebulaGradient.addColorStop(0.3, galaxy.color + '08');
        nebulaGradient.addColorStop(0.6, galaxy.color + '03');
        nebulaGradient.addColorStop(1, 'transparent');
        
        ctx.globalAlpha = 0.3; // Réduction de l'opacité globale
        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(
          galaxy.centerX - galaxy.baseRadius * 1.5,
          galaxy.centerY - galaxy.baseRadius * 1.5,
          galaxy.baseRadius * 3,
          galaxy.baseRadius * 3
        );
        
        ctx.restore();
      });

      // Animer chaque galaxie avec rotation différentielle et interpolation
      galaxiesRef.current.forEach((galaxy) => {
        // Rotation différentielle : chaque étoile tourne à sa propre vitesse
        galaxy.stars.forEach((star) => {
          // Sauvegarder les positions précédentes
          star.prevX = star.x;
          star.prevY = star.y;
          
          // Rotation avec pas de temps fixe pour éviter les saccades
          const fixedDelta = 1/60; // Assume 60 FPS pour un mouvement constant
          star.angle += star.angularVelocity * fixedDelta;
          
          // Normaliser l'angle pour éviter les problèmes de précision
          star.angle = star.angle % (Math.PI * 2);
          
          // Calculer la position cible
          const targetX = galaxy.centerX + Math.cos(star.angle) * star.radius;
          const targetY = galaxy.centerY + Math.sin(star.angle) * star.radius;
          
          // Interpolation linéaire (LERP) pour un mouvement fluide
          const lerpFactor = 0.2; // Plus c'est bas, plus c'est fluide
          star.x = star.prevX * (1 - lerpFactor) + targetX * lerpFactor;
          star.y = star.prevY * (1 - lerpFactor) + targetY * lerpFactor;
          
          // Animation de pulsation basée sur deltaTime
          star.pulsePhase += deltaTime * 1.2;
          const pulseOpacity = star.opacity * (0.7 + 0.3 * Math.sin(star.pulsePhase));
          
          // Interaction avec la souris
          const mouseDistance = Math.sqrt(
            (mouseRef.current.x - star.x) ** 2 + 
            (mouseRef.current.y - star.y) ** 2
          );
          
          let mouseEffect = 1;
          if (mouseDistance < 150) {
            mouseEffect = 1 + (150 - mouseDistance) / 150 * 0.5;
          }

          // Dessiner l'étoile avec glow subtil
          ctx.save();
          
          // Glow très subtil
          ctx.globalAlpha = pulseOpacity * galaxy.opacity * 0.3 * mouseEffect;
          ctx.shadowColor = star.color;
          ctx.shadowBlur = star.size * 2 * mouseEffect;
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * mouseEffect * 0.8, 0, Math.PI * 2);
          ctx.fill();
          
          // Étoile principale plus fine
          ctx.globalAlpha = pulseOpacity * galaxy.opacity * mouseEffect * 0.9;
          ctx.shadowBlur = star.size * mouseEffect;
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.6 * mouseEffect, 0, Math.PI * 2);
          ctx.fill();
          
          // Core brillant très petit
          ctx.shadowBlur = 0;
          ctx.globalAlpha = pulseOpacity * galaxy.opacity;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.2 * mouseEffect, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        });
        
        // Les bras galactiques sont maintenant uniquement représentés par les étoiles
        // Pas de lignes supplémentaires pour un rendu plus propre
      });

      animationFrameRef.current = requestAnimationFrame(() => animate(performance.now()));
    };

    // Initialize
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    animate(performance.now());

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: '#000000',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};

export default AnimatedBackground;