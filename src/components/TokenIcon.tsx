import React from 'react'

interface TokenIconProps {
  token: 'tTRUST' | 'ORACLE' | 'INTUIT'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const TokenIcon: React.FC<TokenIconProps> = ({ token, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  if (token === 'ORACLE') {
    return (
      <img 
        src="/oracle-logo.png" 
        alt="Oracle Token" 
        className={`${sizeClasses[size]} ${className} object-cover rounded-full`}
      />
    )
  }

  // For other tokens, use emoji
  const emoji = token === 'tTRUST' ? '⚡' : '💎'
  const textSize = {
    sm: 'text-sm',
    md: 'text-base', 
    lg: 'text-xl',
    xl: 'text-2xl'
  }

  return (
    <span className={`${textSize[size]} ${className}`}>
      {emoji}
    </span>
  )
}

export default TokenIcon