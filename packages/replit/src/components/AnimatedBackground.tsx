import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
  opacity: number;
  targetOpacity: number;
  size: number;
  connections: number[];
}

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";

      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();

    const particles: Particle[] = [];
    let mouseX = 0;
    let mouseY = 0;

    const createConstellationGrid = () => {
      const gridSize = 12;
      const jitter = 40;

      for (let x = 0; x < window.innerWidth; x += window.innerWidth / gridSize) {
        for (let y = 0; y < window.innerHeight; y += window.innerHeight / gridSize) {
          if (Math.random() < 0.3) continue;

          const jitterX = (Math.random() - 0.5) * jitter * 2;
          const jitterY = (Math.random() - 0.5) * jitter * 2;

          particles.push({
            x: x + jitterX,
            y: y + jitterY,
            originX: x + jitterX,
            originY: y + jitterY,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            opacity: 0.6 + Math.random() * 0.4,
            targetOpacity: 0.6 + Math.random() * 0.4,
            size: 1.5 + Math.random() * 1,
            connections: [],
          });
        }
      }
    };

    createConstellationGrid();

    const handleResize = () => {
      resizeCanvas();

      particles.forEach(particle => {
        if (particle.x > window.innerWidth) particle.x = window.innerWidth - 50;
        if (particle.y > window.innerHeight) particle.y = window.innerHeight - 50;
        if (particle.x < 0) particle.x = 50;
        if (particle.y < 0) particle.y = 50;

        particle.originX = Math.min(particle.originX, window.innerWidth);
        particle.originY = Math.min(particle.originY, window.innerHeight);
      });
    };

    const regenerateParticles = () => {
      particles.length = 0;

      const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 20000);
      const gridSize = Math.sqrt(particleCount);
      const jitter = 40;

      for (let x = 0; x < window.innerWidth; x += window.innerWidth / gridSize) {
        for (let y = 0; y < window.innerHeight; y += window.innerHeight / gridSize) {
          if (Math.random() < 0.2) continue;

          const jitterX = (Math.random() - 0.5) * jitter * 2;
          const jitterY = (Math.random() - 0.5) * jitter * 2;

          particles.push({
            x: x + jitterX,
            y: y + jitterY,
            originX: x + jitterX,
            originY: y + jitterY,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            opacity: 0.6 + Math.random() * 0.4,
            targetOpacity: 0.6 + Math.random() * 0.4,
            size: 1.5 + Math.random() * 1,
            connections: [],
          });
        }
      }
    };

    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        handleResize();
        regenerateParticles();
      }, 100);
    };

    window.addEventListener("resize", debouncedResize);

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;

    const animate = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

      const mouseAttraction = 200;

      particles.forEach(particle => {
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const mouseDistance = Math.sqrt(dx * dx + dy * dy);

        if (mouseDistance < mouseAttraction && mouseDistance > 0) {
          const attractionStrength = 1 - mouseDistance / mouseAttraction;
          const attractionX = (dx / mouseDistance) * attractionStrength * 2;
          const attractionY = (dy / mouseDistance) * attractionStrength * 2;

          particle.vx += attractionX * attractionStrength * 0.002;
          particle.vy += attractionY * attractionStrength * 0.002;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > window.innerWidth) {
          particle.vx *= -1;
          particle.x = Math.max(0, Math.min(window.innerWidth, particle.x));
        }
        if (particle.y < 0 || particle.y > window.innerHeight) {
          particle.vy *= -1;
          particle.y = Math.max(0, Math.min(window.innerHeight, particle.y));
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      const maxConnectionsPerPoint = 2;
      const maxDistance = 100;
      const minOpacity = 0.1;
      const maxOpacity = 0.4;

      particles.forEach((particle, i) => {
        let connectionCount = 0;

        for (let j = i + 1; j < particles.length; j++) {
          if (connectionCount >= maxConnectionsPerPoint) break;

          const otherParticle = particles[j];
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const distanceRatio = distance / maxDistance;
            const lineOpacity = maxOpacity - distanceRatio * (maxOpacity - minOpacity);

            if (lineOpacity > minOpacity) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
              ctx.lineWidth = 1;
              ctx.stroke();
              connectionCount++;
            }
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(resizeTimeout);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "black",
        zIndex: -1,
        pointerEvents: "none"
      }}
    />
  );
}