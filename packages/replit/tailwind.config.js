/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        secondary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        cosmic: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        trust: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        oracle: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'scale-out': 'scaleOut 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'twinkle': 'twinkle 2s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
        'cosmic-shift': 'cosmicShift 20s ease-in-out infinite',
        'stars-drift': 'starsDrift 40s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
        'golden-pulse': 'golden-pulse 2s ease-in-out infinite',
        'mythic-sparkle': 'mythic-sparkle 1.5s ease-in-out infinite',
        'button-pulse': 'button-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'checkmark': 'checkmark 0.6s ease-in-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.9)' },
        },
        bounceGentle: {
          '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-8px)' },
          '60%': { transform: 'translateY(-4px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.3', transform: 'scale(1.1)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(100px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(100px) rotate(-360deg)' },
        },
        cosmicShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        starsDrift: {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(200px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
        'golden-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
            filter: 'brightness(1)',
          },
          '50%': {
            transform: 'scale(1.05)',
            boxShadow: '0 0 40px rgba(251, 191, 36, 0.8), 0 0 60px rgba(251, 191, 36, 0.3)',
            filter: 'brightness(1.2)',
          },
        },
        'mythic-sparkle': {
          '0%, 100%': {
            transform: 'scale(1) rotate(0deg)',
            boxShadow: '0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(168, 85, 247, 0.3)',
          },
          '25%': {
            transform: 'scale(1.02) rotate(90deg)',
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.7), 0 0 60px rgba(168, 85, 247, 0.5)',
          },
          '50%': {
            transform: 'scale(1.05) rotate(180deg)',
            boxShadow: '0 0 40px rgba(236, 72, 153, 0.8), 0 0 80px rgba(168, 85, 247, 0.6)',
          },
          '75%': {
            transform: 'scale(1.02) rotate(270deg)',
            boxShadow: '0 0 30px rgba(236, 72, 153, 0.7), 0 0 60px rgba(168, 85, 247, 0.5)',
          },
        },
        'button-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.8',
          },
        },
        'checkmark': {
          '0%': {
            strokeDasharray: '0 50',
          },
          '100%': {
            strokeDasharray: '50 0',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '40px',
        heavy: '20px',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'hard': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-sm': '0 0 10px rgba(139, 92, 246, 0.2)',
        'glow-lg': '0 0 30px rgba(139, 92, 246, 0.4)',
        'glow-xl': '0 0 40px rgba(139, 92, 246, 0.5)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-yellow': '0 0 20px rgba(245, 158, 11, 0.3)',
        'cosmic': '0 0 50px rgba(139, 92, 246, 0.15), 0 0 100px rgba(59, 130, 246, 0.1)',
        'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.2)',
      },
      dropShadow: {
        'glow': '0 0 10px rgba(139, 92, 246, 0.5)',
        'glow-sm': '0 0 5px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 0 15px rgba(139, 92, 246, 0.6)',
        'cosmic': '0 0 20px rgba(139, 92, 246, 0.4)',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '92': '23rem',
        '96': '24rem',
        '100': '25rem',
        '104': '26rem',
        '108': '27rem',
        '112': '28rem',
        '116': '29rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'cosmic': 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0c0c0c 100%)',
        'cosmic-light': 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 25%, #e2e8f0 50%, #cbd5e1 75%, #ffffff 100%)',
        'stars': `radial-gradient(2px 2px at 20px 30px, #ffffff, transparent),
                  radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.8), transparent),
                  radial-gradient(1px 1px at 90px 40px, rgba(255, 255, 255, 0.6), transparent),
                  radial-gradient(2px 2px at 130px 80px, rgba(255, 255, 255, 0.4), transparent),
                  radial-gradient(1px 1px at 160px 30px, rgba(255, 255, 255, 0.8), transparent)`,
        'shimmer': 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent)',
      },
      backgroundSize: {
        '400': '400% 400%',
        '200': '200px 100px',
      },
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-in-out-circ': 'cubic-bezier(0.85, 0, 0.15, 1)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
        '1200': '1200ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },
      scale: {
        '102': '1.02',
        '103': '1.03',
        '104': '1.04',
        '115': '1.15',
      },
      rotate: {
        '15': '15deg',
        '30': '30deg',
        '60': '60deg',
        '135': '135deg',
        '270': '270deg',
      },
      skew: {
        '15': '15deg',
        '30': '30deg',
      },
      blur: {
        '4xl': '72px',
        '5xl': '96px',
        '6xl': '128px',
      },
      brightness: {
        '25': '.25',
        '175': '1.75',
        '200': '2',
      },
      contrast: {
        '25': '.25',
        '175': '1.75',
        '200': '2',
      },
      saturate: {
        '25': '.25',
        '175': '1.75',
        '200': '2',
      },
      content: {
        'empty': '""',
      },
    },
  },
  plugins: [
    // Custom plugin for glass morphism utilities
    function({ addUtilities, theme, variants }) {
      const glassUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: theme('boxShadow.medium'),
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: theme('boxShadow.medium'),
        },
        '.glass-heavy': {
          background: 'rgba(255, 255, 255, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: theme('boxShadow.hard'),
        },
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
        },
        '.text-shadow-glow': {
          textShadow: '0 0 10px rgba(139, 92, 246, 0.5)',
        },
        '.border-gradient': {
          border: '1px solid transparent',
          background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #8b5cf6, #06b6d4) border-box',
        },
        '.hover-lift': {
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
        '.cosmic-bg': {
          background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0c0c0c 100%)',
          backgroundSize: '400% 400%',
          animation: 'cosmicShift 20s ease-in-out infinite',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundImage: theme('backgroundImage.stars'),
            backgroundRepeat: 'repeat',
            backgroundSize: '200px 100px',
            animation: 'starsDrift 40s linear infinite',
            pointerEvents: 'none',
          },
        },
      };

      addUtilities(glassUtilities, variants('glassUtilities'));
    },
    // Custom plugin for button variants
    function({ addComponents, theme }) {
      const buttons = {
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: theme('fontSize.base'),
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.lg'),
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          '&:focus': {
            outline: 'none',
            ring: '2px',
            ringOffset: '2px',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          color: theme('colors.white'),
          background: 'linear-gradient(to right, #7c3aed, #2563eb)',
          boxShadow: theme('boxShadow.lg'),
          '&:hover': {
            background: 'linear-gradient(to right, #6d28d9, #1d4ed8)',
            boxShadow: theme('boxShadow.xl'),
          },
          '&:focus': {
            ringColor: theme('colors.purple.500'),
          },
        },
        '.btn-secondary': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          color: theme('colors.purple.300'),
          backgroundColor: 'transparent',
          border: `1px solid ${theme('colors.purple.500')}`,
          '&:hover': {
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            borderColor: theme('colors.purple.400'),
          },
          '&:focus': {
            ringColor: theme('colors.purple.500'),
          },
        },
        '.btn-success': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          color: theme('colors.white'),
          background: 'linear-gradient(to right, #059669, #047857)',
          boxShadow: theme('boxShadow.lg'),
          '&:hover': {
            background: 'linear-gradient(to right, #047857, #065f46)',
            boxShadow: theme('boxShadow.xl'),
          },
          '&:focus': {
            ringColor: theme('colors.green.500'),
          },
        },
        '.btn-warning': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          color: theme('colors.white'),
          background: 'linear-gradient(to right, #ea580c, #dc2626)',
          boxShadow: theme('boxShadow.lg'),
          '&:hover': {
            background: 'linear-gradient(to right, #c2410c, #b91c1c)',
            boxShadow: theme('boxShadow.xl'),
          },
          '&:focus': {
            ringColor: theme('colors.orange.500'),
          },
        },
        '.btn-ghost': {
          padding: `${theme('spacing.3')} ${theme('spacing.6')}`,
          color: theme('colors.gray.300'),
          backgroundColor: 'transparent',
          '&:hover': {
            color: theme('colors.white'),
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
          '&:focus': {
            ringColor: theme('colors.purple.500'),
          },
        },
        '.btn-small': {
          padding: `${theme('spacing.1.5')} ${theme('spacing.3')}`,
          fontSize: theme('fontSize.sm'),
        },
        '.btn-large': {
          padding: `${theme('spacing.4')} ${theme('spacing.8')}`,
          fontSize: theme('fontSize.lg'),
        },
      };

      addComponents(buttons);
    },
    // Custom plugin for input variants
    function({ addComponents, theme }) {
      const inputs = {
        '.input': {
          width: '100%',
          padding: `${theme('spacing.3')} ${theme('spacing.4')}`,
          backgroundColor: 'rgba(31, 41, 55, 0.5)',
          border: `1px solid rgba(107, 114, 128, 0.5)`,
          borderRadius: theme('borderRadius.lg'),
          color: theme('colors.white'),
          transition: 'all 0.2s ease-in-out',
          '&::placeholder': {
            color: theme('colors.gray.400'),
          },
          '&:focus': {
            outline: 'none',
            borderColor: 'rgba(139, 92, 246, 0.5)',
            ring: '1px',
            ringColor: 'rgba(139, 92, 246, 0.2)',
          },
        },
        '.input-error': {
          borderColor: 'rgba(239, 68, 68, 0.5)',
          '&:focus': {
            borderColor: 'rgba(239, 68, 68, 0.5)',
            ringColor: 'rgba(239, 68, 68, 0.2)',
          },
        },
        '.input-success': {
          borderColor: 'rgba(16, 185, 129, 0.5)',
          '&:focus': {
            borderColor: 'rgba(16, 185, 129, 0.5)',
            ringColor: 'rgba(16, 185, 129, 0.2)',
          },
        },
      };

      addComponents(inputs);
    },
  ],
}
