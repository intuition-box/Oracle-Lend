import React, { useRef, useEffect } from 'react';

interface Star {
  // Polar position for differential rotation
  angle: number;
  radius: number;
  // Calculated Cartesian position
  x: number;
  y: number;
  // Previous positions for interpolation
  prevX: number;
  prevY: number;
  // Visual properties
  size: number;
  opacity: number;
  color: string;
  // Animation
  pulsePhase: number;
  // Individual rotation speed (differential rotation)
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

    // Detect mobile device and reduce performance impact
    const isMobile = window.innerWidth <= 768;
    const isLowEndDevice = navigator.hardwareConcurrency <= 4;
    
    const resizeCanvas = () => {
      // Use device pixel ratio for sharp rendering but cap it for performance
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initializeGalaxies();
    };

    const createSpiral = (centerX: number, centerY: number, baseRadius: number, armCount: number, starCount: number, color: string, baseRotationSpeed: number): Star[] => {
      const stars: Star[] = [];
      
      for (let i = 0; i < starCount; i++) {
        // Create a logarithmic spiral
        const t = (i / starCount) * Math.PI * 4; // 4 tours de spirale
        const spiralRadius = baseRadius * (0.2 + 0.8 * (i / starCount));
        
        // Ajouter de la variation pour chaque bras
        const armIndex = Math.floor(Math.random() * armCount);
        const armOffset = (armIndex * 2 * Math.PI) / armCount;
        
        // Polar position with random variation
        // Invert angle if rotation is negative to match spiral direction
        const angleMultiplier = baseRotationSpeed < 0 ? -1 : 1;
        const angle = angleMultiplier * (t + armOffset) + (Math.random() - 0.5) * 0.5;
        const radius = spiralRadius + (Math.random() - 0.5) * baseRadius * 0.2;
        
        // Differential rotation: stars near center rotate faster
        // Simplified Kepler formula: v ∝ 1/√r
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
          prevX: x, // Initialize previous positions
          prevY: y,
          size: Math.random() * 2 + 0.5, // Smaller and refined stars
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
      const isMobile = window.innerWidth <= 768;
      const starCount = Math.floor((canvas.width * canvas.height) / (isMobile ? 10000 : 5000)); // Less stars on mobile
      
      for (let i = 0; i < starCount; i++) {
        backgroundStarsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.2, // Very small stars
          opacity: Math.random() * 0.8 + 0.2,
          twinklePhase: Math.random() * Math.PI * 2
        });
      }
    };

    const initializeGalaxies = () => {
      galaxiesRef.current = [];
      initializeBackgroundStars();
      
      // Main galaxy - adjust for mobile devices
      const isMobile = window.innerWidth <= 768;
      const mainGalaxyX = canvas.width * 0.6;
      const mainGalaxyY = canvas.height * 0.45;
      const starCount = isMobile ? 150 : 300; // Reduce stars on mobile
      const baseRadius = Math.min(canvas.width, canvas.height) * (isMobile ? 0.18 : 0.22);
      
      galaxiesRef.current.push({
        centerX: mainGalaxyX,
        centerY: mainGalaxyY,
        baseRadius: baseRadius,
        rotationSpeed: 0.06, // Rotation plus rapide
        armCount: 4,
        stars: createSpiral(
          mainGalaxyX,
          mainGalaxyY,
          baseRadius,
          4,
          starCount,
          '#ff6b35', // Orange chaud pour la galaxie principale
          0.06
        ),
        color: '#ff6b35', // Orange chaud
        opacity: 1.0
      });

      // Secondary galaxy - adjust for mobile
      if (!isMobile) {
        const secondGalaxyX = canvas.width * 0.25;
        const secondGalaxyY = canvas.height * 0.25;
        galaxiesRef.current.push({
          centerX: secondGalaxyX,
          centerY: secondGalaxyY,
          baseRadius: Math.min(canvas.width, canvas.height) * 0.12,
          rotationSpeed: -0.08, // Rotation inverse plus rapide
          armCount: 3,
          stars: createSpiral(
            secondGalaxyX,
            secondGalaxyY,
            Math.min(canvas.width, canvas.height) * 0.12,
            3,
            isMobile ? 100 : 200,
            '#ffd700', // Warm gold
            -0.08
          ),
          color: '#ffd700', // Gold
          opacity: 0.9
        });
      }

      // Distant galaxy - only on desktop for performance
      if (!isMobile) {
        const thirdGalaxyX = canvas.width * 0.75;
        const thirdGalaxyY = canvas.height * 0.70;
        galaxiesRef.current.push({
          centerX: thirdGalaxyX,
          centerY: thirdGalaxyY,
          baseRadius: Math.min(canvas.width, canvas.height) * 0.10,
          rotationSpeed: 0.1, // La plus rapide
          armCount: 2,
          stars: createSpiral(
            thirdGalaxyX,
            thirdGalaxyY,
            Math.min(canvas.width, canvas.height) * 0.10,
            2,
            isMobile ? 50 : 100,
            '#ff9a56', // Warm peach
            0.1
          ),
          color: '#ff9a56', // Peach
          opacity: 0.7
        });
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    const animate = (currentTime: number) => {
      // Calculate deltaTime with smoothing to avoid jerkiness
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const rawDeltaTime = (currentTime - lastTimeRef.current) / 1000; // Convert to seconds
      lastTimeRef.current = currentTime;
      
      // Skip frames on mobile for better performance
      const isMobile = window.innerWidth <= 768;
      if (isMobile && rawDeltaTime < 1/30) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Smooth deltaTime to avoid sudden variations
      const targetDelta = Math.min(rawDeltaTime, 1/30); // Cap at 30 FPS minimum
      smoothDeltaRef.current = smoothDeltaRef.current * 0.9 + targetDelta * 0.1;
      const deltaTime = smoothDeltaRef.current;
      
      timeRef.current += deltaTime;
      
      // Cosmic gradient background - deep black with subtle warm tones
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
      );
      gradient.addColorStop(0, '#0a0604'); // Black with very slight warm tint
      gradient.addColorStop(0.5, '#040201'); // Noir profond
      gradient.addColorStop(1, '#000000'); // Noir pur
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw static background stars
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
      
      // Add colored nebulae
      galaxiesRef.current.forEach((galaxy, index) => {
        ctx.save();
        
        // Very subtle background nebula for each galaxy
        const nebulaGradient = ctx.createRadialGradient(
          galaxy.centerX, galaxy.centerY, 0,
          galaxy.centerX, galaxy.centerY, galaxy.baseRadius * 1.5
        );
        nebulaGradient.addColorStop(0, galaxy.color + '10'); // Beaucoup plus subtil
        nebulaGradient.addColorStop(0.3, galaxy.color + '08');
        nebulaGradient.addColorStop(0.6, galaxy.color + '03');
        nebulaGradient.addColorStop(1, 'transparent');
        
        ctx.globalAlpha = 0.3; // Reduce global opacity
        ctx.fillStyle = nebulaGradient;
        ctx.fillRect(
          galaxy.centerX - galaxy.baseRadius * 1.5,
          galaxy.centerY - galaxy.baseRadius * 1.5,
          galaxy.baseRadius * 3,
          galaxy.baseRadius * 3
        );
        
        ctx.restore();
      });

      // Animate each galaxy with differential rotation and interpolation
      galaxiesRef.current.forEach((galaxy) => {
        // Differential rotation: each star rotates at its own speed
        galaxy.stars.forEach((star) => {
          // Save previous positions
          star.prevX = star.x;
          star.prevY = star.y;
          
          // Rotation with fixed timestep to avoid jerkiness
          const fixedDelta = 1/60; // Assume 60 FPS pour un mouvement constant
          star.angle += star.angularVelocity * fixedDelta;
          
          // Normalize angle to avoid precision issues
          star.angle = star.angle % (Math.PI * 2);
          
          // Calculer la position cible
          const targetX = galaxy.centerX + Math.cos(star.angle) * star.radius;
          const targetY = galaxy.centerY + Math.sin(star.angle) * star.radius;
          
          // Linear interpolation (LERP) for smooth movement
          const lerpFactor = 0.2; // Plus c'est bas, plus c'est fluide
          star.x = star.prevX * (1 - lerpFactor) + targetX * lerpFactor;
          star.y = star.prevY * (1 - lerpFactor) + targetY * lerpFactor;
          
          // Pulsation animation based on deltaTime
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

          // Draw star with subtle glow (simplified on mobile)
          ctx.save();
          
          const isMobile = window.innerWidth <= 768;
          
          if (!isMobile) {
            // Desktop: full glow effect
            ctx.globalAlpha = pulseOpacity * galaxy.opacity * 0.3 * mouseEffect;
            ctx.shadowColor = star.color;
            ctx.shadowBlur = star.size * 2 * mouseEffect;
          } else {
            // Mobile: simplified rendering
            ctx.globalAlpha = star.opacity * galaxy.opacity * 0.5;
          }
          
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * (isMobile ? 1 : mouseEffect * 0.8), 0, Math.PI * 2);
          ctx.fill();
          
          // Thinner main star
          ctx.globalAlpha = pulseOpacity * galaxy.opacity * mouseEffect * 0.9;
          ctx.shadowBlur = star.size * mouseEffect;
          ctx.fillStyle = star.color;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.6 * mouseEffect, 0, Math.PI * 2);
          ctx.fill();
          
          // Very small bright core
          ctx.shadowBlur = 0;
          ctx.globalAlpha = pulseOpacity * galaxy.opacity;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.2 * mouseEffect, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        });
        
        // Galaxy arms are now represented only by stars
        // No additional lines for cleaner rendering
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