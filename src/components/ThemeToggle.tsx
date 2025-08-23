import React from 'react'

interface ThemeToggleProps {
  isDarkMode: boolean
  toggleTheme: () => void
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkMode, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg glass-effect border border-gray-600/50 hover:border-gray-500/50 transition-all duration-200 group"
      title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5">
        {/* Sun icon */}
        <i
          className={`fas fa-sun absolute inset-0 transition-all duration-300 ${
            isDarkMode
              ? 'opacity-0 rotate-90 scale-0'
              : 'opacity-100 rotate-0 scale-100 text-yellow-400'
          }`}
        ></i>
        
        {/* Moon icon */}
        <i
          className={`fas fa-moon absolute inset-0 transition-all duration-300 ${
            isDarkMode
              ? 'opacity-100 rotate-0 scale-100 text-blue-400'
              : 'opacity-0 -rotate-90 scale-0'
          }`}
        ></i>
      </div>
      
      {/* Glow effect */}
      <div
        className={`absolute inset-0 rounded-lg blur-sm transition-all duration-300 ${
          isDarkMode
            ? 'bg-blue-400/20 group-hover:bg-blue-400/30'
            : 'bg-yellow-400/20 group-hover:bg-yellow-400/30'
        }`}
      ></div>
    </button>
  )
}

export default ThemeToggle
