import React, { useRef, useEffect } from 'react';

interface Star {
  // Position polaire dans la galaxie
  angle: number;
  radius: number;
  // Position carthésienne calculée
  x: number;
  y: number;
  // Propriétés visuelles
  size: number;
  opacity: number;
  color: string;
  // Animation
  rotationSpeed: number;
  pulsePhase: number;
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

    const createSpiral = (centerX: number, centerY: number, baseRadius: number, armCount: number, starCount: number, color: string): Star[] => {
      const stars: Star[] = [];
      
      for (let i = 0; i < starCount; i++) {
        // Créer une spirale logarithmique
        const t = (i / starCount) * Math.PI * 4; // 4 tours de spirale
        const spiralRadius = baseRadius * (0.2 + 0.8 * (i / starCount));
        
        // Ajouter de la variation pour chaque bras
        const armIndex = Math.floor(Math.random() * armCount);
        const armOffset = (armIndex * 2 * Math.PI) / armCount;
        
        // Position polaire avec variation aléatoire
        const angle = t + armOffset + (Math.random() - 0.5) * 0.5;
        const radius = spiralRadius + (Math.random() - 0.5) * baseRadius * 0.2;
        
        // Conversion en coordonnées cartésiennes
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        stars.push({
          angle: angle,
          radius: radius,
          x,
          y,
          size: Math.random() * 2 + 0.5, // Étoiles plus petites et raffinées
          opacity: Math.random() * 0.4 + 0.6,
          color: color,
          rotationSpeed: (0.8 + Math.random() * 0.4) * (radius > spiralRadius * 0.7 ? 0.9 : 1.1),
          pulsePhase: Math.random() * Math.PI * 2
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
      
      // Galaxie principale - taille et position optimisées
      galaxiesRef.current.push({
        centerX: canvas.width * 0.5,
        centerY: canvas.height * 0.5,
        baseRadius: Math.min(canvas.width, canvas.height) * 0.25,
        rotationSpeed: 0.003,
        armCount: 4,
        stars: createSpiral(
          canvas.width * 0.5,
          canvas.height * 0.5,
          Math.min(canvas.width, canvas.height) * 0.25,
          4,
          300,
          '#ff6b35' // Orange chaud pour la galaxie principale
        ),
        color: '#ff6b35', // Orange chaud
        opacity: 1.0
      });

      // Galaxie secondaire - rotation inverse
      galaxiesRef.current.push({
        centerX: canvas.width * 0.8,
        centerY: canvas.height * 0.3,
        baseRadius: Math.min(canvas.width, canvas.height) * 0.15,
        rotationSpeed: -0.004,
        armCount: 3,
        stars: createSpiral(
          canvas.width * 0.8,
          canvas.height * 0.3,
          Math.min(canvas.width, canvas.height) * 0.15,
          3,
          200,
          '#ffd700' // Doré chaud
        ),
        color: '#ffd700', // Doré
        opacity: 0.9
      });

      // Galaxie lointaine - rotation rapide
      galaxiesRef.current.push({
        centerX: canvas.width * 0.2,
        centerY: canvas.height * 0.7,
        baseRadius: Math.min(canvas.width, canvas.height) * 0.08,
        rotationSpeed: 0.005,
        armCount: 2,
        stars: createSpiral(
          canvas.width * 0.2,
          canvas.height * 0.7,
          Math.min(canvas.width, canvas.height) * 0.08,
          2,
          100,
          '#ff9a56' // Pêche chaud
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
      // Calcul du deltaTime pour une animation fluide
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;
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

      // Animer chaque galaxie
      galaxiesRef.current.forEach((galaxy) => {
        galaxy.stars.forEach((star) => {
          // Rotation continue basée sur deltaTime
          star.angle += galaxy.rotationSpeed * star.rotationSpeed * deltaTime * 60; // 60 pour normaliser à 60fps
          
          // Recalculer position
          star.x = galaxy.centerX + Math.cos(star.angle) * star.radius;
          star.y = galaxy.centerY + Math.sin(star.angle) * star.radius;
          
          // Animation de pulsation basée sur deltaTime
          star.pulsePhase += deltaTime * 1.2;
          const pulseOpacity = star.opacity * (0.7 + 0.3 * Math.sin(star.pulsePhase));
          
          // Interaction avec la souris (effet gravitationnel)
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
        
        // Dessiner les bras galactiques avec effet lumineux
        ctx.save();
        
        for (let arm = 0; arm < galaxy.armCount; arm++) {
          const armAngle = (arm * 2 * Math.PI) / galaxy.armCount;
          
          // Une seule passe subtile pour les bras
          for (let pass = 0; pass < 1; pass++) {
            ctx.beginPath();
            ctx.globalAlpha = 0.08 * galaxy.opacity;
            ctx.strokeStyle = galaxy.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = galaxy.color;
            ctx.shadowBlur = 4;
            
            for (let r = galaxy.baseRadius * 0.1; r < galaxy.baseRadius; r += 5) {
              const spiralAngle = armAngle + (r / galaxy.baseRadius) * Math.PI * 2 + timeRef.current * galaxy.rotationSpeed * 60;
              const x = galaxy.centerX + Math.cos(spiralAngle) * r;
              const y = galaxy.centerY + Math.sin(spiralAngle) * r;
              
              if (r === galaxy.baseRadius * 0.1) {
                ctx.moveTo(x, y);
              } else {
                ctx.lineTo(x, y);
              }
            }
            
            ctx.stroke();
          }
        }
        
        ctx.restore();
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