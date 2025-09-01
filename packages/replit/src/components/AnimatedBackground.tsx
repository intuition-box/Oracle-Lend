import React, { useRef, useEffect } from 'react';

// Galaxy morphological types following Hubble sequence
type GalaxyType = 'Sa' | 'Sb' | 'Sc' | 'SBa' | 'SBb' | 'SBc' | 'E0' | 'E7' | 'Irr';

// Stellar population types
type StellarPopulation = 'young' | 'intermediate' | 'old' | 'core';

interface Star {
  // Position
  x: number;
  y: number;
  z: number; // For 3D depth
  // Polar coordinates for rotation
  angle: number;
  radius: number;
  // Physical properties
  temperature: number; // Kelvin
  luminosity: number;  // Solar luminosities
  mass: number;        // Solar masses
  age: number;         // Gigayears
  // Visual properties
  size: number;
  color: string;
  opacity: number;
  brightness: number;
  // Animation
  pulsePhase: number;
  twinkleRate: number;
  angularVelocity: number; // Individual angular velocity for differential rotation
  // Population type
  population: StellarPopulation;
}

interface DustLane {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  opacity: number;
  rotation: number;
}

interface HIIRegion {
  x: number;
  y: number;
  radius: number;
  brightness: number;
  color: string;
  pulsePhase: number;
}

interface SpiralArm {
  armIndex: number;
  pitch: number; // Pitch angle in degrees
  startRadius: number;
  endRadius: number;
  width: number;
  density: number;
  points: { x: number; y: number; width: number }[];
}

interface GalacticCore {
  x: number;
  y: number;
  radius: number;
  luminosity: number;
  temperature: number;
  blackHoleMass: number; // In solar masses
}

interface RealisticGalaxy {
  // Identity
  id: string;
  type: GalaxyType;
  
  // Position and orientation
  centerX: number;
  centerY: number;
  inclination: number; // 0 = face-on, 90 = edge-on
  positionAngle: number; // Rotation in sky plane
  
  // Morphological parameters
  totalRadius: number;
  bulgeRadius: number;
  diskRadius: number;
  bulgeToTotal: number; // B/T ratio
  
  // Structural components
  core: GalacticCore;
  spiralArms: SpiralArm[];
  barLength?: number; // For barred spirals
  barAngle?: number;
  
  // Stellar content
  stars: Star[];
  totalStarCount: number;
  
  // ISM components
  dustLanes: DustLane[];
  hiiRegions: HIIRegion[];
  
  // Dynamics
  rotationCurve: (r: number) => number; // Velocity as function of radius
  patternSpeed: number; // Spiral pattern rotation
  baseRotationSpeed: number; // Base rotation speed
  
  // Visual properties
  baseColor: string;
  armColor: string;
  coreColor: string;
  opacity: number;
  brightness: number;
}

interface BackgroundStar {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinklePhase: number;
  color: string;
  temperature: number;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });
  const galaxiesRef = useRef<RealisticGalaxy[]>([]);
  const backgroundStarsRef = useRef<BackgroundStar[]>([]);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const smoothDeltaRef = useRef(1/60); // Smoothed deltaTime for fluid animation

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: false, // Performance boost for opaque background
      imageSmoothingEnabled: true, // Better antialiasing
      imageSmoothingQuality: 'high' // High quality smoothing
    });
    if (!ctx) return;

    // Performance detection
    const isMobile = window.innerWidth <= 768;
    const isLowEndDevice = navigator.hardwareConcurrency <= 4;
    
    const resizeCanvas = () => {
      const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      initializeGalaxies();
    };

    // Helper to normalize angle between 0 and 2π
    const normalizeAngle = (angle: number): number => {
      angle = angle % (2 * Math.PI);
      if (angle < 0) angle += 2 * Math.PI;
      return angle;
    };

    // Stellar temperature to RGB color conversion
    const temperatureToColor = (temp: number): string => {
      // Based on blackbody radiation
      let r, g, b;
      
      if (temp < 3500) {
        // M-type stars (red)
        r = 255;
        g = Math.floor(180 * (temp / 3500));
        b = Math.floor(50 * (temp / 3500));
      } else if (temp < 5000) {
        // K-type stars (orange)
        r = 255;
        g = Math.floor(180 + 75 * ((temp - 3500) / 1500));
        b = Math.floor(50 + 100 * ((temp - 3500) / 1500));
      } else if (temp < 6000) {
        // G-type stars (yellow-white)
        r = 255;
        g = 255;
        b = Math.floor(150 + 105 * ((temp - 5000) / 1000));
      } else if (temp < 7500) {
        // F-type stars (white)
        r = 255;
        g = 255;
        b = 255;
      } else if (temp < 10000) {
        // A-type stars (blue-white)
        r = Math.floor(255 - 50 * ((temp - 7500) / 2500));
        g = Math.floor(255 - 30 * ((temp - 7500) / 2500));
        b = 255;
      } else {
        // B/O-type stars (blue)
        r = Math.floor(205 - 55 * Math.min((temp - 10000) / 20000, 1));
        g = Math.floor(225 - 45 * Math.min((temp - 10000) / 20000, 1));
        b = 255;
      }
      
      return `rgb(${r}, ${g}, ${b})`;
    };

    // Sérsic profile for galaxy brightness distribution
    const sersicProfile = (r: number, re: number, n: number): number => {
      const bn = 1.9992 * n - 0.3271; // Approximation for b_n
      return Math.exp(-bn * (Math.pow(r / re, 1 / n) - 1));
    };

    // Logarithmic spiral equation
    const logarithmicSpiral = (t: number, a: number, b: number): { r: number; theta: number } => {
      const r = a * Math.exp(b * t);
      return { r, theta: t };
    };

    // Create a realistic spiral arm with density wave theory
    const createSpiralArm = (
      armIndex: number,
      totalArms: number,
      pitch: number,
      galaxyRadius: number,
      centerX: number,
      centerY: number
    ): SpiralArm => {
      const points: { x: number; y: number; width: number }[] = [];
      const startAngle = (2 * Math.PI * armIndex) / totalArms;
      const pitchRad = (pitch * Math.PI) / 180;
      
      // Generate points along the spiral
      for (let t = 0; t < 4 * Math.PI; t += 0.1) {
        const spiral = logarithmicSpiral(t, galaxyRadius * 0.1, Math.tan(pitchRad));
        const angle = spiral.theta + startAngle;
        const r = Math.min(spiral.r, galaxyRadius);
        
        // Add width variation along the arm
        const widthFactor = 1 - (r / galaxyRadius) * 0.7;
        const width = galaxyRadius * 0.15 * widthFactor;
        
        points.push({
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle),
          width
        });
        
        if (r >= galaxyRadius) break;
      }
      
      return {
        armIndex,
        pitch,
        startRadius: galaxyRadius * 0.1,
        endRadius: galaxyRadius,
        width: galaxyRadius * 0.15,
        density: 1.0,
        points
      };
    };

    // Create stellar population based on location in galaxy
    const createStellarPopulation = (
      galaxy: Partial<RealisticGalaxy>,
      populationType: StellarPopulation,
      count: number,
      baseRotationSpeed: number
    ): Star[] => {
      const stars: Star[] = [];
      const centerX = galaxy.centerX || 0;
      const centerY = galaxy.centerY || 0;
      const radius = galaxy.totalRadius || 100;
      
      for (let i = 0; i < count; i++) {
        let r: number, angle: number, temp: number, age: number, size: number;
        
        switch (populationType) {
          case 'core':
            // Core stars - old, yellow-white, concentrated
            r = Math.random() * radius * 0.2 * Math.sqrt(Math.random()); // r² distribution
            angle = Math.random() * 2 * Math.PI;
            temp = 4500 + Math.random() * 2000; // 4500-6500K
            age = 8 + Math.random() * 5; // 8-13 Gyr
            size = 0.5 + Math.random() * 1.5;
            break;
            
          case 'young':
            // Young stars in spiral arms - hot, blue
            const armChoice = Math.floor(Math.random() * (galaxy.spiralArms?.length || 2));
            const armProgress = Math.random();
            if (galaxy.spiralArms && galaxy.spiralArms[armChoice]) {
              const pointIndex = Math.floor(armProgress * galaxy.spiralArms[armChoice].points.length);
              const point = galaxy.spiralArms[armChoice].points[pointIndex];
              const spread = galaxy.spiralArms[armChoice].width * (0.3 + Math.random() * 0.7);
              r = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
              angle = Math.atan2(point.y - centerY, point.x - centerX);
              // Add spread perpendicular to arm
              const perpAngle = angle + Math.PI / 2;
              const offset = (Math.random() - 0.5) * spread;
              r += offset * Math.cos(perpAngle - angle);
              angle += (offset * Math.sin(perpAngle - angle)) / r;
            } else {
              r = radius * (0.3 + Math.random() * 0.5);
              angle = Math.random() * 2 * Math.PI;
            }
            temp = 10000 + Math.random() * 20000; // 10000-30000K
            age = Math.random() * 0.1; // 0-100 Myr
            size = 1 + Math.random() * 2;
            break;
            
          case 'intermediate':
            // Intermediate age stars - distributed throughout disk
            r = radius * (0.2 + Math.random() * 0.6);
            angle = Math.random() * 2 * Math.PI;
            temp = 3500 + Math.random() * 4000; // 3500-7500K
            age = 1 + Math.random() * 7; // 1-8 Gyr
            size = 0.7 + Math.random() * 1.3;
            break;
            
          case 'old':
            // Old stars in halo - red, diffuse
            r = radius * (0.5 + Math.random() * 0.5);
            angle = Math.random() * 2 * Math.PI;
            temp = 3000 + Math.random() * 2000; // 3000-5000K
            age = 10 + Math.random() * 3; // 10-13 Gyr
            size = 0.4 + Math.random() * 0.8;
            break;
            
          default:
            r = radius * Math.random();
            angle = Math.random() * 2 * Math.PI;
            temp = 5000;
            age = 5;
            size = 1;
        }
        
        // Calculate position
        const x = centerX + r * Math.cos(angle);
        const y = centerY + r * Math.sin(angle);
        const z = (Math.random() - 0.5) * radius * 0.1; // Thin disk
        
        // Calculate luminosity from temperature (simplified Stefan-Boltzmann)
        const luminosity = Math.pow(temp / 5778, 4) * Math.pow(size, 2);
        
        // Differential rotation: stars closer to center rotate faster
        // Simplified Kepler formula: v ∝ 1/√r
        const normalizedRadius = r / radius;
        const angularVelocity = baseRotationSpeed * (1 / Math.sqrt(0.2 + normalizedRadius * 0.8));
        
        stars.push({
          x,
          y,
          z,
          angle: normalizeAngle(angle),
          radius: r,
          temperature: temp,
          luminosity,
          mass: size, // Simplified mass-radius relation
          age,
          size: size * (isMobile ? 0.8 : 1),
          color: temperatureToColor(temp),
          opacity: 0.7 + Math.random() * 0.3,
          brightness: luminosity / 10,
          pulsePhase: Math.random() * Math.PI * 2,
          twinkleRate: 0.5 + Math.random() * 2,
          angularVelocity,
          population: populationType
        });
      }
      
      return stars;
    };

    // Create dust lanes for spiral galaxies
    const createDustLanes = (galaxy: Partial<RealisticGalaxy>): DustLane[] => {
      const lanes: DustLane[] = [];
      const centerRadius = galaxy.totalRadius || 100;
      
      // Create dust lanes that follow spiral structure but offset
      if (galaxy.spiralArms) {
        galaxy.spiralArms.forEach((arm, index) => {
          // Dust lane trails slightly behind the spiral arm
          lanes.push({
            startAngle: (index * 2 * Math.PI) / galaxy.spiralArms!.length - 0.1,
            endAngle: (index * 2 * Math.PI) / galaxy.spiralArms!.length + 2,
            innerRadius: centerRadius * 0.2,
            outerRadius: centerRadius * 0.8,
            opacity: 0.3 + Math.random() * 0.2,
            rotation: 0
          });
        });
      }
      
      return lanes;
    };

    // Create HII regions (star forming regions)
    const createHIIRegions = (galaxy: Partial<RealisticGalaxy>): HIIRegion[] => {
      const regions: HIIRegion[] = [];
      
      // Place HII regions along spiral arms
      if (galaxy.spiralArms) {
        galaxy.spiralArms.forEach(arm => {
          const numRegions = 5 + Math.floor(Math.random() * 10);
          for (let i = 0; i < numRegions; i++) {
            const pointIndex = Math.floor(Math.random() * arm.points.length);
            const point = arm.points[pointIndex];
            
            regions.push({
              x: point.x + (Math.random() - 0.5) * arm.width,
              y: point.y + (Math.random() - 0.5) * arm.width,
              radius: 5 + Math.random() * 15,
              brightness: 0.5 + Math.random() * 0.5,
              color: '#ff69b4', // Pink emission nebula color
              pulsePhase: Math.random() * Math.PI * 2
            });
          }
        });
      }
      
      return regions;
    };

    // Create a complete galaxy
    const createRealisticGalaxy = (
      type: GalaxyType,
      centerX: number,
      centerY: number,
      radius: number,
      baseRotationSpeed: number
    ): RealisticGalaxy => {
      const galaxy: Partial<RealisticGalaxy> = {
        id: `galaxy-${Date.now()}-${Math.random()}`,
        type,
        centerX,
        centerY,
        inclination: Math.random() * 30, // Mostly face-on for better visuals
        positionAngle: Math.random() * 360,
        totalRadius: radius,
        opacity: 0.9,
        brightness: 1.0,
        baseRotationSpeed
      };
      
      // Set morphological parameters based on type
      switch (type) {
        case 'Sa':
        case 'SBa':
          galaxy.bulgeToTotal = 0.4;
          galaxy.bulgeRadius = radius * 0.4;
          galaxy.diskRadius = radius;
          break;
        case 'Sb':
        case 'SBb':
          galaxy.bulgeToTotal = 0.25;
          galaxy.bulgeRadius = radius * 0.25;
          galaxy.diskRadius = radius;
          break;
        case 'Sc':
        case 'SBc':
          galaxy.bulgeToTotal = 0.1;
          galaxy.bulgeRadius = radius * 0.15;
          galaxy.diskRadius = radius;
          break;
        default:
          galaxy.bulgeToTotal = 0.2;
          galaxy.bulgeRadius = radius * 0.2;
          galaxy.diskRadius = radius;
      }
      
      // Create galactic core
      galaxy.core = {
        x: centerX,
        y: centerY,
        radius: galaxy.bulgeRadius,
        luminosity: 1e10, // 10 billion solar luminosities
        temperature: 5500,
        blackHoleMass: 1e6 // 1 million solar masses
      };
      
      // Create spiral arms for spiral galaxies
      if (type.startsWith('S')) {
        const armCount = 2 + Math.floor(Math.random() * 2); // 2-3 arms
        const pitch = type.endsWith('a') ? 10 : type.endsWith('b') ? 15 : 25;
        
        galaxy.spiralArms = [];
        for (let i = 0; i < armCount; i++) {
          galaxy.spiralArms.push(
            createSpiralArm(i, armCount, pitch, radius, centerX, centerY)
          );
        }
        
        // Add bar for barred spirals
        if (type.startsWith('SB')) {
          galaxy.barLength = radius * 0.3;
          galaxy.barAngle = Math.random() * Math.PI;
        }
      }
      
      // Create stellar populations
      const starCount = isMobile ? 500 : 1500;
      const stars: Star[] = [
        ...createStellarPopulation(galaxy, 'core', Math.floor(starCount * 0.3), baseRotationSpeed),
        ...createStellarPopulation(galaxy, 'young', Math.floor(starCount * 0.2), baseRotationSpeed),
        ...createStellarPopulation(galaxy, 'intermediate', Math.floor(starCount * 0.35), baseRotationSpeed),
        ...createStellarPopulation(galaxy, 'old', Math.floor(starCount * 0.15), baseRotationSpeed)
      ];
      
      galaxy.stars = stars;
      galaxy.totalStarCount = stars.length;
      
      // Create ISM components
      galaxy.dustLanes = createDustLanes(galaxy);
      galaxy.hiiRegions = createHIIRegions(galaxy);
      
      // Define rotation curve (simplified flat rotation curve)
      galaxy.rotationCurve = (r: number) => {
        const vmax = 220; // km/s (typical for spiral galaxy)
        const rcore = galaxy.bulgeRadius!;
        if (r < rcore) {
          return vmax * (r / rcore);
        }
        return vmax;
      };
      
      galaxy.patternSpeed = 0.05; // Spiral pattern rotation speed
      
      // Set colors based on type
      galaxy.baseColor = '#fff5e6';
      galaxy.armColor = '#b0e0ff';
      galaxy.coreColor = '#fffacd';
      
      return galaxy as RealisticGalaxy;
    };

    const initializeBackgroundStars = () => {
      backgroundStarsRef.current = [];
      const starCount = Math.floor((canvas.width * canvas.height) / (isMobile ? 15000 : 8000));
      
      for (let i = 0; i < starCount; i++) {
        const temp = 3000 + Math.random() * 7000; // 3000-10000K
        backgroundStarsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.2 + 0.1,
          opacity: Math.random() * 0.6 + 0.2,
          twinklePhase: Math.random() * Math.PI * 2,
          color: temperatureToColor(temp),
          temperature: temp
        });
      }
    };

    const initializeGalaxies = () => {
      galaxiesRef.current = [];
      initializeBackgroundStars();
      
      // Main galaxy - large spiral with smooth rotation
      const mainGalaxyX = canvas.width * 0.6;
      const mainGalaxyY = canvas.height * 0.45;
      const mainRadius = Math.min(canvas.width, canvas.height) * (isMobile ? 0.2 : 0.25);
      
      galaxiesRef.current.push(
        createRealisticGalaxy('Sb', mainGalaxyX, mainGalaxyY, mainRadius, -0.5)
      );
      
      // Secondary galaxy - smaller barred spiral, same direction for trailing arms
      if (!isMobile) {
        const secondGalaxyX = canvas.width * 0.2;
        const secondGalaxyY = canvas.height * 0.7;
        const secondRadius = mainRadius * 0.6;
        
        galaxiesRef.current.push(
          createRealisticGalaxy('SBc', secondGalaxyX, secondGalaxyY, secondRadius, -0.7)
        );
        
        // Third galaxy - smaller and faster, same direction for trailing arms
        const thirdGalaxyX = canvas.width * 0.85;
        const thirdGalaxyY = canvas.height * 0.8;
        const thirdRadius = mainRadius * 0.5;
        
        const fastGalaxy = createRealisticGalaxy('Sc', thirdGalaxyX, thirdGalaxyY, thirdRadius, -1.0);
        galaxiesRef.current.push(fastGalaxy);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current.x = event.clientX;
      mouseRef.current.y = event.clientY;
    };

    // Render functions for each component
    const renderGalacticCore = (ctx: CanvasRenderingContext2D, galaxy: RealisticGalaxy) => {
      const { core } = galaxy;
      
      // Multi-layer gradient for realistic core
      for (let i = 5; i > 0; i--) {
        const layerRadius = core.radius * (i / 5) * 1.5;
        const gradient = ctx.createRadialGradient(
          core.x, core.y, 0,
          core.x, core.y, layerRadius
        );
        
        const alpha = Math.pow(1 / i, 2) * 0.3;
        gradient.addColorStop(0, `rgba(255, 250, 205, ${alpha * 2})`); // Bright center
        gradient.addColorStop(0.2, `rgba(255, 245, 200, ${alpha * 1.5})`);
        gradient.addColorStop(0.5, `rgba(255, 240, 190, ${alpha})`);
        gradient.addColorStop(0.8, `rgba(255, 235, 180, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
          core.x - layerRadius,
          core.y - layerRadius,
          layerRadius * 2,
          layerRadius * 2
        );
      }
      
      // Super bright central point (supermassive black hole region)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(core.x, core.y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const renderDustLanes = (ctx: CanvasRenderingContext2D, galaxy: RealisticGalaxy) => {
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      
      galaxy.dustLanes.forEach(lane => {
        const gradient = ctx.createRadialGradient(
          galaxy.centerX, galaxy.centerY, lane.innerRadius,
          galaxy.centerX, galaxy.centerY, lane.outerRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.3, `rgba(40, 20, 10, ${lane.opacity * 0.3})`);
        gradient.addColorStop(0.7, `rgba(30, 15, 5, ${lane.opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(galaxy.centerX, galaxy.centerY, lane.outerRadius, lane.startAngle, lane.endAngle);
        ctx.arc(galaxy.centerX, galaxy.centerY, lane.innerRadius, lane.endAngle, lane.startAngle, true);
        ctx.closePath();
        ctx.fill();
      });
      
      ctx.restore();
    };

    const renderHIIRegions = (ctx: CanvasRenderingContext2D, galaxy: RealisticGalaxy) => {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      
      galaxy.hiiRegions.forEach(region => {
        // Pulsating brightness
        const pulse = 0.8 + 0.2 * Math.sin(region.pulsePhase);
        
        // Soft glow
        const gradient = ctx.createRadialGradient(
          region.x, region.y, 0,
          region.x, region.y, region.radius
        );
        gradient.addColorStop(0, `rgba(255, 105, 180, ${region.brightness * pulse * 0.5})`);
        gradient.addColorStop(0.3, `rgba(255, 20, 147, ${region.brightness * pulse * 0.3})`);
        gradient.addColorStop(0.7, `rgba(199, 21, 133, ${region.brightness * pulse * 0.1})`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(region.x, region.y, region.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.restore();
    };

    const renderStars = (ctx: CanvasRenderingContext2D, galaxy: RealisticGalaxy, deltaTime: number) => {
      // Sort stars by z-coordinate for proper depth rendering
      const sortedStars = [...galaxy.stars].sort((a, b) => a.z - b.z);
      
      sortedStars.forEach(star => {
        // Depth-based scaling
        const depthScale = 1 + star.z / (galaxy.totalRadius * 0.1);
        const apparentSize = star.size * depthScale;
        
        // Distance-based dimming
        const distanceFromCore = Math.sqrt(
          (star.x - galaxy.core.x) ** 2 + (star.y - galaxy.core.y) ** 2
        );
        const distanceDimming = sersicProfile(distanceFromCore, galaxy.bulgeRadius, 2);
        
        // Population-based rendering
        ctx.save();
        
        // Apply inclination transformation
        const inclinationRad = (galaxy.inclination * Math.PI) / 180;
        const yCompressed = galaxy.centerY + (star.y - galaxy.centerY) * Math.cos(inclinationRad);
        
        // Mouse interaction
        const mouseDistance = Math.sqrt(
          (mouseRef.current.x - star.x) ** 2 + 
          (mouseRef.current.y - yCompressed) ** 2
        );
        const mouseEffect = mouseDistance < 100 ? 1 + (100 - mouseDistance) / 200 : 1;
        
        // Twinkling effect
        star.pulsePhase += deltaTime * star.twinkleRate;
        const twinkle = 0.9 + 0.1 * Math.sin(star.pulsePhase);
        
        // Different rendering for different populations
        switch (star.population) {
          case 'core':
            // Dense core stars
            ctx.globalAlpha = star.opacity * 0.9 * twinkle * distanceDimming;
            ctx.fillStyle = star.color;
            ctx.shadowBlur = apparentSize * 2;
            ctx.shadowColor = star.color;
            break;
            
          case 'young':
            // Bright blue stars in arms
            ctx.globalAlpha = star.opacity * twinkle * mouseEffect;
            ctx.fillStyle = star.color;
            ctx.shadowBlur = apparentSize * 3 * mouseEffect;
            ctx.shadowColor = star.color;
            break;
            
          case 'intermediate':
            // Regular disk stars
            ctx.globalAlpha = star.opacity * 0.7 * twinkle;
            ctx.fillStyle = star.color;
            ctx.shadowBlur = apparentSize;
            ctx.shadowColor = star.color;
            break;
            
          case 'old':
            // Faint halo stars
            ctx.globalAlpha = star.opacity * 0.5 * twinkle;
            ctx.fillStyle = star.color;
            ctx.shadowBlur = 0;
            break;
        }
        
        // Draw the star
        ctx.beginPath();
        ctx.arc(star.x, yCompressed, apparentSize * mouseEffect, 0, Math.PI * 2);
        ctx.fill();
        
        // Add bright core for hot stars
        if (star.temperature > 7000) {
          ctx.globalAlpha = star.opacity * twinkle;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(star.x, yCompressed, apparentSize * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });
    };

    const animate = (currentTime: number) => {
      // Calculate smooth deltaTime to avoid jerkiness
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const rawDeltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      
      // Skip frames on mobile for performance
      if (isMobile && rawDeltaTime < 1/30) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Cap deltaTime to prevent jumps during lag/tab switches (max 33ms = 30fps minimum)
      const deltaTime = Math.min(rawDeltaTime, 1/30);
      
      timeRef.current += deltaTime;
      
      // Clear canvas with deep space gradient
      const spaceGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.5
      );
      spaceGradient.addColorStop(0, '#050505');
      spaceGradient.addColorStop(0.5, '#020202');
      spaceGradient.addColorStop(1, '#000000');
      
      ctx.fillStyle = spaceGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render background stars
      backgroundStarsRef.current.forEach(star => {
        star.twinklePhase += deltaTime * 3;
        const twinkle = 0.7 + 0.3 * Math.sin(star.twinklePhase);
        
        ctx.save();
        ctx.globalAlpha = star.opacity * twinkle;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      
      // Render each galaxy with smooth direct rotation
      galaxiesRef.current.forEach(galaxy => {
        galaxy.stars.forEach(star => {
          // Simple accumulation like CSS linear infinite animation
          star.angle += star.angularVelocity * deltaTime;
          
          // Smooth angle normalization without discontinuities
          if (star.angle > 2 * Math.PI) {
            star.angle -= 2 * Math.PI;
          } else if (star.angle < 0) {
            star.angle += 2 * Math.PI;
          }
          
          // Direct position calculation from updated angle
          star.x = galaxy.centerX + Math.cos(star.angle) * star.radius;
          star.y = galaxy.centerY + Math.sin(star.angle) * star.radius;
        });
        
        // Update HII regions
        galaxy.hiiRegions.forEach(region => {
          region.pulsePhase += deltaTime * 2;
        });
        
        // Update dust lanes rotation
        galaxy.dustLanes.forEach(lane => {
          lane.rotation += deltaTime * 0.01;
        });
        
        // Render galaxy components in order
        renderDustLanes(ctx, galaxy);
        renderStars(ctx, galaxy, deltaTime);
        renderHIIRegions(ctx, galaxy);
        renderGalacticCore(ctx, galaxy);
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
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ 
        background: '#000000',
        zIndex: -1,
        willChange: 'transform' // Optimize for animations
      }}
    />
  );
};

export default AnimatedBackground;