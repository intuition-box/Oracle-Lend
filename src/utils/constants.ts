// Intuition testnet configuration
export const INTUITION_TESTNET = {
  chainId: 13579,
  name: 'Intuition Testnet',
  rpcUrl: 'https://testnet.rpc.intuition.systems/http',
  wsUrl: 'wss://testnet.rpc.intuition.systems/ws',
  blockExplorer: 'https://testnet.explorer.intuition.systems',
  nativeCurrency: {
    name: 'Intuition Trust Token',
    symbol: 'tTRUST',
    decimals: 18,
  },
  contracts: {
    // These would be the actual deployed contract addresses
    oracleLend: '0x1234567890123456789012345678901234567890', // Placeholder
    oracleToken: '0x2345678901234567890123456789012345678901', // Placeholder
    tTrustToken: '0x3456789012345678901234567890123456789012', // Placeholder - Native token wrapper
    dex: '0x4567890123456789012345678901234567890123', // Placeholder
  }
}

// Token information
export const TOKENS = {
  tTRUST: {
    symbol: 'tTRUST',
    name: 'Intuition Trust Token',
    address: INTUITION_TESTNET.contracts.tTrustToken,
    decimals: 18,
    icon: '⚡',
    color: '#3B82F6',
    isNative: true
  },
  ORACLE: {
    symbol: 'ORACLE',
    name: 'Oracle Token',
    address: INTUITION_TESTNET.contracts.oracleToken,
    decimals: 18,
    icon: '🔮',
    color: '#8B5CF6',
    isNative: false
  }
} as const

// Protocol constants
export const PROTOCOL_CONFIG = {
  name: 'ORACLE LEND',
  description: 'A decentralized finance protocol that revolutionizes lending, borrowing, and token swapping on Intuition testnet. Trust your Intuition.',
  exchangeRate: 100, // 1 tTRUST = 100 ORACLE
  maxLTV: 75, // 75% Loan-to-Value ratio
  liquidationThreshold: 85, // 85% liquidation threshold
  liquidationBonus: 5, // 5% liquidation bonus
  tradingFee: 0.3, // 0.3% trading fee
  maxPriceImpact: 5, // 5% maximum price impact
  
  // Initial token supplies
  initialSupply: {
    ORACLE: '10000000' // 10 million ORACLE tokens
  }
}

// External links
export const EXTERNAL_LINKS = {
  faucet: 'https://testnet.hub.intuition.systems/',
  docs: 'https://docs.intuition.systems',
  discord: 'https://discord.gg/intuition',
  twitter: 'https://twitter.com/intuitionsys',
  github: 'https://github.com/intuition-systems'
}

// API endpoints and configuration
export const API_CONFIG = {
  // These would be actual API endpoints for real-time data
  priceAPI: 'https://api.intuition.systems/v1/prices',
  analyticsAPI: 'https://api.intuition.systems/v1/analytics',
  transactionsAPI: 'https://api.intuition.systems/v1/transactions',
  refreshInterval: 30000, // 30 seconds
  retryAttempts: 3,
  timeout: 10000 // 10 seconds
}

// UI Configuration
export const UI_CONFIG = {
  // Animation timings
  animations: {
    fast: 150,
    normal: 300,
    slow: 500
  },
  
  // Breakpoints (Tailwind CSS)
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  },
  
  // Color scheme
  colors: {
    primary: '#8B5CF6',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4'
  },
  
  // Component sizes
  sizes: {
    button: {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg'
    },
    input: {
      small: 'px-3 py-1.5 text-sm',
      medium: 'px-4 py-2 text-base',
      large: 'px-6 py-3 text-lg'
    }
  }
}

// Transaction settings
export const TRANSACTION_CONFIG = {
  defaultGasLimit: 300000,
  gasLimitMultiplier: 1.2, // 20% buffer
  maxGasPrice: '50', // Gwei
  confirmations: 1,
  timeoutMs: 300000, // 5 minutes
  
  // Slippage settings
  defaultSlippage: 0.5, // 0.5%
  maxSlippage: 5, // 5%
  slippageOptions: [0.1, 0.5, 1.0, 2.0, 5.0],
  
  // Amount limits
  minTradeAmount: '0.01',
  maxTradeAmount: '1000000', // 1M tokens
  
  // Retry logic
  maxRetries: 3,
  retryDelay: 2000, // 2 seconds
}

// Local storage keys
export const STORAGE_KEYS = {
  walletConnected: 'oracleLend_walletConnected',
  theme: 'oracleLend_theme',
  slippage: 'oracleLend_slippage',
  userPreferences: 'oracleLend_userPreferences',
  cachedBalances: 'oracleLend_cachedBalances',
  transactionHistory: 'oracleLend_transactionHistory'
} as const

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  NETWORK_MISMATCH: 'Please switch to Intuition testnet',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  INSUFFICIENT_ALLOWANCE: 'Please approve token spending first',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  INVALID_AMOUNT: 'Please enter a valid amount',
  AMOUNT_TOO_LOW: 'Amount is too low',
  AMOUNT_TOO_HIGH: 'Amount exceeds maximum limit',
  PRICE_IMPACT_TOO_HIGH: 'Price impact too high. Please reduce amount',
  SLIPPAGE_TOO_HIGH: 'Slippage tolerance too high',
  MARKET_CLOSED: 'Market is currently closed',
  INSUFFICIENT_LIQUIDITY: 'Insufficient liquidity for this trade',
  UNHEALTHY_POSITION: 'This action would make your position unhealthy',
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again'
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  TOKENS_APPROVED: 'Tokens approved successfully',
  SUPPLY_SUCCESS: 'Tokens supplied successfully',
  WITHDRAW_SUCCESS: 'Tokens withdrawn successfully',
  BORROW_SUCCESS: 'Tokens borrowed successfully',
  REPAY_SUCCESS: 'Loan repaid successfully',
  SWAP_SUCCESS: 'Tokens swapped successfully'
} as const

// Feature flags
export const FEATURES = {
  enableAnalytics: true,
  enableLending: true,
  enableBorrowing: true,
  enableSwap: true,
  enableLiquidation: false, // Disable liquidation for initial release
  enableGovernance: false, // Future feature
  enableStaking: false, // Future feature
  enableMobile: true,
  enableNotifications: true,
  enableDarkMode: true,
  enableAdvancedTrading: false, // Advanced trading features
  enableBatchTransactions: false // Batch transaction support
} as const

// Chart configuration
export const CHART_CONFIG = {
  colors: {
    primary: '#8B5CF6',
    secondary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    grid: 'rgba(156, 163, 175, 0.1)',
    text: '#9CA3AF'
  },
  
  // Time ranges
  timeRanges: [
    { label: '24H', value: '24h', duration: 24 * 60 * 60 * 1000 },
    { label: '7D', value: '7d', duration: 7 * 24 * 60 * 60 * 1000 },
    { label: '30D', value: '30d', duration: 30 * 24 * 60 * 60 * 1000 },
    { label: '90D', value: '90d', duration: 90 * 24 * 60 * 60 * 1000 },
    { label: '1Y', value: '1y', duration: 365 * 24 * 60 * 60 * 1000 }
  ],
  
  // Chart options
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
      },
    },
  }
}

// Validation rules
export const VALIDATION_RULES = {
  address: {
    required: true,
    pattern: /^0x[a-fA-F0-9]{40}$/,
    message: 'Please enter a valid Ethereum address'
  },
  
  amount: {
    required: true,
    min: 0.000001,
    max: 1000000,
    decimals: 18,
    message: 'Please enter a valid amount'
  },
  
  slippage: {
    required: true,
    min: 0.01,
    max: 50,
    decimals: 2,
    message: 'Slippage must be between 0.01% and 50%'
  },
  
  gasPrice: {
    required: false,
    min: 1,
    max: 1000,
    decimals: 9,
    message: 'Gas price must be between 1 and 1000 Gwei'
  }
}

// Network status
export const NETWORK_STATUS = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  WRONG_NETWORK: 'wrong_network'
} as const

// Transaction types
export const TRANSACTION_TYPES = {
  SUPPLY: 'supply',
  WITHDRAW: 'withdraw',
  BORROW: 'borrow',
  REPAY: 'repay',
  SWAP: 'swap',
  APPROVE: 'approve',
  LIQUIDATION: 'liquidation'
} as const

// Default values
export const DEFAULTS = {
  slippage: 0.5,
  gasLimit: 300000,
  refreshInterval: 30000,
  theme: 'dark',
  currency: 'USD',
  language: 'en',
  
  // Chart defaults
  chartTimeframe: '24h',
  chartType: 'line',
  
  // Table defaults
  tablePageSize: 10,
  tableSortBy: 'timestamp',
  tableSortOrder: 'desc'
} as const

export type NetworkStatus = typeof NETWORK_STATUS[keyof typeof NETWORK_STATUS]
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]
export type TokenSymbol = keyof typeof TOKENS
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]
