import React, { useRef, useEffect } from 'react';

// Galaxy morphological types following Hubble sequence
type GalaxyType = 'Sa' | 'Sb' | 'Sc' | 'SBa' | 'SBb' | 'SBc' | 'E0' | 'E7' | 'Irr' | 'PolarRing';

// Stellar population types
type StellarPopulation = 'young' | 'intermediate' | 'old' | 'core';

interface Star {
  // Position (now fixed relative to galaxy center)
  x: number; // Current position (for compatibility during transition)
  y: number; // Current position (for compatibility during transition)
  baseX: number; // Fixed position relative to galaxy center
  baseY: number; // Fixed position relative to galaxy center
  z: number; // For 3D depth
  // Initial polar coordinates (for setup only)
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

interface PolarRingStructure {
  enabled: boolean;
  radius: number;
  thickness: number;
  angle: number; // Current rotation angle
  baseAngle: number; // Base orientation (perpendicular to main disk)
  rotationSpeed: number;
  opacity: number;
  color: string;
  stars: Star[]; // Separate star population for the ring
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
  currentRotation: number; // Current rotation angle for canvas transformation

  // Visual properties
  baseColor: string;
  armColor: string;
  coreColor: string;
  opacity: number;
  brightness: number;

  // Special structures
  polarRing?: PolarRingStructure;
  eccentricity?: number; // For elliptical galaxies (0 = circular, 1 = very elongated)
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

        // Calculate fixed position relative to galaxy center
        const baseX = centerX + r * Math.cos(angle);
        const baseY = centerY + r * Math.sin(angle);
        const z = (Math.random() - 0.5) * radius * 0.1; // Thin disk

        // Calculate luminosity from temperature (simplified Stefan-Boltzmann)
        const luminosity = Math.pow(temp / 5778, 4) * Math.pow(size, 2);

        stars.push({
          x: baseX, // Current position (kept for compatibility)
          y: baseY, // Current position (kept for compatibility)
          baseX, // Fixed position relative to galaxy center
          baseY, // Fixed position relative to galaxy center
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
        case 'E0':
          galaxy.bulgeToTotal = 1.0;
          galaxy.bulgeRadius = radius;
          galaxy.diskRadius = radius;
          galaxy.eccentricity = 0; // Perfectly circular
          break;
        case 'E7':
          galaxy.bulgeToTotal = 1.0;
          galaxy.bulgeRadius = radius;
          galaxy.diskRadius = radius;
          galaxy.eccentricity = 0.7; // Very elongated
          break;
        case 'PolarRing':
          galaxy.bulgeToTotal = 0.6;
          galaxy.bulgeRadius = radius * 0.6;
          galaxy.diskRadius = radius;
          galaxy.eccentricity = 0.8; // Eye-shaped elongation
          // Initialize polar ring structure
          galaxy.polarRing = {
            enabled: true,
            radius: radius * 1.2,
            thickness: radius * 0.2,
            angle: 0,
            baseAngle: Math.PI / 2, // Perpendicular to main disk
            rotationSpeed: baseRotationSpeed * 0.5, // Même sens que les galaxies
            opacity: 0.7,
            color: '#FFD700', // Doré cosmique pour l'anneau
            stars: []
          };
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

      // Create stellar populations - REDUCED for smooth rotation
      const starCount = isMobile ? 100 : 300;
      const stars: Star[] = [
        ...createStellarPopulation(galaxy, 'core', Math.floor(starCount * 0.3), baseRotationSpeed),
        ...createStellarPopulation(galaxy, 'young', Math.floor(starCount * 0.2), baseRotationSpeed),
        ...createStellarPopulation(galaxy, 'intermediate', Math.floor(starCount * 0.35), baseRotationSpeed),
        ...createStellarPopulation(galaxy, 'old', Math.floor(starCount * 0.15), baseRotationSpeed)
      ];

      galaxy.stars = stars;
      galaxy.totalStarCount = stars.length;

      // Create polar ring stars if needed
      if (galaxy.polarRing?.enabled) {
        const ringStarCount = Math.floor(starCount * 0.4);
        const ringStars: Star[] = [];

        for (let i = 0; i < ringStarCount; i++) {
          const theta = Math.random() * 2 * Math.PI;
          const ringR = galaxy.polarRing.radius + (Math.random() - 0.5) * galaxy.polarRing.thickness;

          // Position stars in a disk that will rotate perpendicular to main galaxy
          // Initial positions: ring lies in XZ plane (perpendicular to XY plane)
          const baseX = centerX + ringR * Math.cos(theta);
          const baseY = centerY; // All stars at same Y initially (edge-on view)
          const z = ringR * Math.sin(theta); // Z gives the vertical spread

          // Young blue stars in the ring
          const temp = 10000 + Math.random() * 15000; // 10000-25000K (blue stars)
          const size = 0.8 + Math.random() * 1.5;

          ringStars.push({
            x: baseX, // Current position (kept for compatibility)
            y: baseY, // Current position (kept for compatibility)
            baseX, // Fixed position relative to galaxy center
            baseY, // Fixed position relative to galaxy center
            z,
            angle: theta, // Initial orbital angle
            radius: ringR, // Orbital radius
            temperature: temp,
            luminosity: Math.pow(temp / 5778, 4) * Math.pow(size, 2),
            mass: size,
            age: Math.random() * 0.5, // Young stars
            size: size * (isMobile ? 0.8 : 1),
            color: temperatureToColor(temp),
            opacity: 0.8 + Math.random() * 0.2,
            brightness: 1,
            pulsePhase: Math.random() * Math.PI * 2,
            twinkleRate: 0.5 + Math.random() * 2,
            population: 'young'
          });
        }

        galaxy.polarRing.stars = ringStars;
      }

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
      galaxy.currentRotation = 0; // Initialize current rotation angle

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
        createRealisticGalaxy('Sb', mainGalaxyX, mainGalaxyY, mainRadius, -1.0)
      );

      // Secondary galaxy - smaller barred spiral, same direction for trailing arms
      if (!isMobile) {
        const secondGalaxyX = canvas.width * 0.2;
        const secondGalaxyY = canvas.height * 0.7;
        const secondRadius = mainRadius * 0.6;

        galaxiesRef.current.push(
          createRealisticGalaxy('SBc', secondGalaxyX, secondGalaxyY, secondRadius, -1.4)
        );

        // Third galaxy - smaller and faster, same direction for trailing arms
        const thirdGalaxyX = canvas.width * 0.85;
        const thirdGalaxyY = canvas.height * 0.8;
        const thirdRadius = mainRadius * 0.5;

        const fastGalaxy = createRealisticGalaxy('Sc', thirdGalaxyX, thirdGalaxyY, thirdRadius, -2.0);
        galaxiesRef.current.push(fastGalaxy);

        // Eye galaxy - polar ring type in top-left corner
        const eyeGalaxyX = canvas.width * 0.15;
        const eyeGalaxyY = canvas.height * 0.20;
        const eyeRadius = mainRadius * 0.45;

        const eyeGalaxy = createRealisticGalaxy('PolarRing', eyeGalaxyX, eyeGalaxyY, eyeRadius, -0.6);
        galaxiesRef.current.push(eyeGalaxy);
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
        
        // Couleurs spéciales pour la galaxie œil (centre violet)
        if (galaxy.type === 'PolarRing') {
          gradient.addColorStop(0, `rgba(138, 43, 226, ${alpha * 2})`); // Violet brillant
          gradient.addColorStop(0.2, `rgba(148, 0, 211, ${alpha * 1.5})`); // Violet foncé
          gradient.addColorStop(0.5, `rgba(75, 0, 130, ${alpha})`); // Indigo
          gradient.addColorStop(0.8, `rgba(72, 61, 139, ${alpha * 0.5})`); // Slate blue
        } else {
          // Couleurs normales pour les autres galaxies
          gradient.addColorStop(0, `rgba(255, 250, 205, ${alpha * 2})`); // Bright center
          gradient.addColorStop(0.2, `rgba(255, 245, 200, ${alpha * 1.5})`);
          gradient.addColorStop(0.5, `rgba(255, 240, 190, ${alpha})`);
          gradient.addColorStop(0.8, `rgba(255, 235, 180, ${alpha * 0.5})`);
        }
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

      // Apply differential rotation: dust lanes rotate 90% as fast as stars
      ctx.translate(galaxy.centerX, galaxy.centerY);
      ctx.rotate(galaxy.currentRotation * 1.0); // Même sens que la galaxie
      ctx.translate(-galaxy.centerX, -galaxy.centerY);

      galaxy.dustLanes.forEach(lane => {
        const gradient = ctx.createRadialGradient(
          galaxy.centerX, galaxy.centerY, lane.innerRadius,
          galaxy.centerX, galaxy.centerY, lane.outerRadius
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.3, `rgba(255, 80, 40, ${lane.opacity * 0.4})`); // Rouge H-alpha
        gradient.addColorStop(0.7, `rgba(200, 40, 20, ${lane.opacity * 0.6})`); // Orange profond
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

    const renderPolarRing = (ctx: CanvasRenderingContext2D, galaxy: RealisticGalaxy, deltaTime: number) => {
      if (!galaxy.polarRing?.enabled || !galaxy.polarRing.stars) return;

      const ring = galaxy.polarRing;

      ctx.save();

      // Render ring background glow (ellipse that shows the ring plane)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = ring.opacity * 0.2;

      // The ring appears as an ellipse when viewed edge-on
      const gradient = ctx.createRadialGradient(
        galaxy.centerX, galaxy.centerY, ring.radius * 0.8,
        galaxy.centerX, galaxy.centerY, ring.radius * 1.2
      );
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, ring.color);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();

      // Draw ellipse showing the ring's orientation
      // The ellipse rotates to show the ring spinning perpendicular to main disk
      const viewAngle = ring.angle; // This represents the ring's rotation
      const ellipseWidth = ring.radius;
      const ellipseHeight = ring.radius * Math.abs(Math.sin(viewAngle)) * 0.4; // Perspective effect

      ctx.ellipse(
        galaxy.centerX,
        galaxy.centerY,
        ellipseWidth,
        ellipseHeight,
        0, // No additional rotation needed
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();

      // Render ring stars as a rotating perpendicular disk
      ctx.save();

      // Calculate 3D positions for all stars based on ring rotation
      const starsWithPosition = ring.stars.map(star => {
        // Original position in ring's local coordinates (XZ plane)
        const localX = star.baseX - galaxy.centerX;
        const localZ = star.z;

        // Rotate the ring around the Y axis (perpendicular to main galaxy)
        const rotatedX = localX * Math.cos(ring.angle) - localZ * Math.sin(ring.angle);
        const rotatedZ = localX * Math.sin(ring.angle) + localZ * Math.cos(ring.angle);

        // Final position in screen coordinates
        const screenX = galaxy.centerX + rotatedX;
        const screenY = galaxy.centerY + rotatedZ * 0.3; // Compress Z for perspective

        return {
          star,
          x: screenX,
          y: screenY,
          z: rotatedZ,
          visibility: Math.cos(ring.angle) // Stars on back side are dimmer
        };
      });

      // Sort by Z coordinate (back to front)
      starsWithPosition.sort((a, b) => a.z - b.z);

      starsWithPosition.forEach(({ star, x, y, z, visibility }) => {
        // Hide stars that are behind the galaxy
        if (z < -ring.radius * 0.3) return;

        // Depth and visibility effects
        const depthFactor = 1 + z / (ring.radius * 2);
        const apparentSize = star.size * depthFactor;
        const apparentOpacity = star.opacity * (0.4 + 0.6 * depthFactor) * Math.max(0.3, Math.abs(visibility));

        // Twinkling effect
        star.pulsePhase += deltaTime * star.twinkleRate;
        const twinkle = 0.9 + 0.1 * Math.sin(star.pulsePhase);

        ctx.globalAlpha = apparentOpacity * twinkle;
        ctx.fillStyle = star.color;
        ctx.shadowBlur = apparentSize * 2;
        ctx.shadowColor = star.color;

        ctx.beginPath();
        ctx.arc(x, y, apparentSize, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      ctx.restore();
    };

    const renderStars = (ctx: CanvasRenderingContext2D, galaxy: RealisticGalaxy, deltaTime: number) => {
      // Sort stars by z-coordinate for proper depth rendering
      const sortedStars = [...galaxy.stars].sort((a, b) => a.z - b.z);

      sortedStars.forEach(star => {
        // Depth-based scaling
        const depthScale = 1 + star.z / (galaxy.totalRadius * 0.1);
        const apparentSize = star.size * depthScale;

        // Distance-based dimming using fixed positions
        const distanceFromCore = Math.sqrt(
          (star.baseX - galaxy.core.x) ** 2 + (star.baseY - galaxy.core.y) ** 2
        );
        const distanceDimming = sersicProfile(distanceFromCore, galaxy.bulgeRadius, 2);

        // Population-based rendering
        ctx.save();

        // For canvas-rotated galaxies, use baseX/baseY directly (transformation is handled by canvas)
        // Apply inclination only for non-canvas-rotated systems if needed
        const useDirectPositions = true; // Canvas rotation handles all transformations

        const renderX = star.baseX;
        const renderY = useDirectPositions ? star.baseY :
          galaxy.centerY + (star.baseY - galaxy.centerY) * Math.cos((galaxy.inclination * Math.PI) / 180);

        // Mouse interaction using render positions
        const mouseDistance = Math.sqrt(
          (mouseRef.current.x - renderX) ** 2 +
          (mouseRef.current.y - renderY) ** 2
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

        // Draw the star using render positions (canvas handles rotation)
        ctx.beginPath();
        ctx.arc(renderX, renderY, apparentSize * mouseEffect, 0, Math.PI * 2);
        ctx.fill();

        // Add bright core for hot stars
        if (star.temperature > 7000) {
          ctx.globalAlpha = star.opacity * twinkle;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(renderX, renderY, apparentSize * 0.3, 0, Math.PI * 2);
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

      // Smooth deltaTime to reduce variations and jitter
      if (!smoothDeltaRef.current) smoothDeltaRef.current = 1/60;
      // Exponential moving average for smooth deltaTime
      smoothDeltaRef.current = smoothDeltaRef.current * 0.8 + rawDeltaTime * 0.2;

      // Cap deltaTime to prevent jumps during lag/tab switches (max 33ms = 30fps minimum)
      const deltaTime = Math.min(smoothDeltaRef.current, 1/30);

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

      // Update galaxy rotations using canvas context transformation
      galaxiesRef.current.forEach(galaxy => {
        // Simply update the galaxy's rotation angle
        galaxy.currentRotation += galaxy.baseRotationSpeed * deltaTime;

        // Normalize rotation angle to prevent overflow
        if (galaxy.currentRotation > 2 * Math.PI) {
          galaxy.currentRotation -= 2 * Math.PI;
        } else if (galaxy.currentRotation < 0) {
          galaxy.currentRotation += 2 * Math.PI;
        }

        // Update polar ring rotation if present
        if (galaxy.polarRing?.enabled) {
          galaxy.polarRing.angle += galaxy.polarRing.rotationSpeed * deltaTime;

          // Normalize polar ring angle
          if (galaxy.polarRing.angle > 2 * Math.PI) {
            galaxy.polarRing.angle -= 2 * Math.PI;
          } else if (galaxy.polarRing.angle < 0) {
            galaxy.polarRing.angle += 2 * Math.PI;
          }
        }

        // Update HII regions
        galaxy.hiiRegions.forEach(region => {
          region.pulsePhase += deltaTime * 2;
        });

        // Dust lanes rotate with differential rotation (handled in rendering)

        // Render galaxy with canvas context rotation
        if (galaxy.type === 'PolarRing') {
          // Special rendering for eye galaxy with differential rotation

          // Render dust lanes first with differential rotation
          renderDustLanes(ctx, galaxy);

          // Then render the main disk
          ctx.save();

          // Apply transformations in correct order for rotation
          ctx.translate(galaxy.centerX, galaxy.centerY);

          // Apply elliptical transform BEFORE rotation
          if (galaxy.eccentricity && galaxy.eccentricity > 0) {
            ctx.scale(1, 1 - galaxy.eccentricity * 0.7); // Compress vertically first
          }

          // Then apply rotation to the elliptical shape
          ctx.rotate(galaxy.currentRotation);
          ctx.translate(-galaxy.centerX, -galaxy.centerY);

          renderStars(ctx, galaxy, deltaTime);
          renderGalacticCore(ctx, galaxy);

          ctx.restore();

          // Render polar ring on top with its own rotation
          renderPolarRing(ctx, galaxy, deltaTime);
        } else {
          // Standard galaxy rendering with differential rotation

          // Render dust lanes first with their own differential rotation
          renderDustLanes(ctx, galaxy);

          // Then render everything else with normal rotation
          ctx.save();

          // Apply rotation transformation for stars and other components
          ctx.translate(galaxy.centerX, galaxy.centerY);
          ctx.rotate(galaxy.currentRotation);
          ctx.translate(-galaxy.centerX, -galaxy.centerY);

          renderStars(ctx, galaxy, deltaTime);
          renderHIIRegions(ctx, galaxy);
          renderGalacticCore(ctx, galaxy);

          ctx.restore();
        }
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
