import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

const ParticleSystem: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const particlesRef = useRef<Particle[]>([]);

  // Couleurs vives et variées
  const colors = [
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#10B981', // Emerald
    '#F97316', // Orange
    '#EC4899', // Pink
    '#3B82F6', // Blue
    '#84CC16', // Lime
    '#A855F7', // Violet
  ];

  const createParticle = (canvas: HTMLCanvasElement): Particle => {
    // Spawn anywhere on screen
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    
    // Random velocity with spatial behavior
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.5 + 0.5;
    
    const maxLife = 600 + Math.random() * 400; // Longer life
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 1.5 + 0.5, // Smaller particles (0.5 to 2)
      color: colors[Math.floor(Math.random() * colors.length)],
      life: maxLife,
      maxLife
    };
  };

  const updateParticles = (canvas: HTMLCanvasElement) => {
    const particles = particlesRef.current;
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      
      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Spatial behavior - faster orbital movement with more chaos
      const time = Date.now() * 0.002; // Double speed
      const orbitX1 = canvas.width * 0.3 + Math.sin(time * 0.8) * 150;
      const orbitY1 = canvas.height * 0.3 + Math.cos(time * 1.1) * 120;
      const orbitX2 = canvas.width * 0.7 + Math.sin(time * 1.2) * 180;
      const orbitY2 = canvas.height * 0.7 + Math.cos(time * 0.9) * 140;
      
      // Distance to orbital points
      const dx1 = orbitX1 - particle.x;
      const dy1 = orbitY1 - particle.y;
      const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      
      const dx2 = orbitX2 - particle.x;
      const dy2 = orbitY2 - particle.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      
      // Stronger attraction with randomness
      const attractionStrength = 0.015 + Math.random() * 0.01;
      if (dist1 < dist2 && dist1 > 30) {
        particle.vx += (dx1 / dist1) * attractionStrength;
        particle.vy += (dy1 / dist1) * attractionStrength;
      } else if (dist2 > 30) {
        particle.vx += (dx2 / dist2) * attractionStrength;
        particle.vy += (dy2 / dist2) * attractionStrength;
      }
      
      // More chaotic floating motion
      const floatStrength = 0.008 + Math.random() * 0.006;
      particle.vx += Math.sin(time * 4 + particle.x * 0.02 + Math.random()) * floatStrength;
      particle.vy += Math.cos(time * 3.2 + particle.y * 0.025 + Math.random()) * floatStrength;
      
      // Much stronger random drift
      particle.vx += (Math.random() - 0.5) * 0.08;
      particle.vy += (Math.random() - 0.5) * 0.08;
      
      // Less damping for more energy
      particle.vx *= 0.995;
      particle.vy *= 0.995;
      
      // Wrap around screen edges instead of removing
      if (particle.x < -10) particle.x = canvas.width + 10;
      if (particle.x > canvas.width + 10) particle.x = -10;
      if (particle.y < -10) particle.y = canvas.height + 10;
      if (particle.y > canvas.height + 10) particle.y = -10;
      
      // Update life
      particle.life--;
      
      // Remove only dead particles
      if (particle.life <= 0) {
        particles.splice(i, 1);
      }
    }
    
    // Add new particles
    while (particles.length < 80) {
      particles.push(createParticle(canvas));
    }
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    const particles = particlesRef.current;
    
    particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      
      // Draw particle with glow
      const gradient = ctx.createRadialGradient(
        particle.x, particle.y, 0,
        particle.x, particle.y, particle.size * 2
      );
      
      gradient.addColorStop(0, `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(0.7, `${particle.color}${Math.floor(alpha * 128).toString(16).padStart(2, '0')}`);
      gradient.addColorStop(1, `${particle.color}00`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Core particle
      ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const animate = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (!canvas || !ctx) return;
    
    // Clear canvas completely
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    updateParticles(canvas);
    drawParticles(ctx);
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize particles
    const canvas = canvasRef.current;
    if (canvas) {
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push(createParticle(canvas));
      }
    }
    
    animate();
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ 
        zIndex: 5,
        mixBlendMode: 'screen'
      }}
    />
  );
};

export default ParticleSystem;