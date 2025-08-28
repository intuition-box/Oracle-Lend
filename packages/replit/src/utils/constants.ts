// Intuition testnet configuration
export const INTUITION_TESTNET = {
  chainId: 13579,
  name: 'Intuition Testnet',
  rpcUrl: 'https://testnet.rpc.intuition.systems',
  wsUrl: 'wss://testnet.rpc.intuition.systems/ws',
  blockExplorer: 'https://testnet.explorer.intuition.systems',
  nativeCurrency: {
    name: 'Testnet TRUST',
    symbol: 'TTRUST',
    decimals: 18,
  },
  contracts: {
    // ✅ WORKING: Real Intuition testnet addresses with liquidity and funding
    oracleLend: '0x5CdfBB614F07DA297fBfCb0Dcc9765463F2cCE9e', // OracleLend contract (5M ORACLE funded)
    oracleToken: '0xF840731096FAeD511eFda466ACaD39531101fBAc', // OracleToken contract (10M supply)
    dex: '0x072c2b3f3937aD47Da25dE0de1e36E4C366d5FED', // DEX contract (10 TTRUST + 5M ORACLE liquidity)
    tTrustToken: '0x0000000000000000000000000000000000000000', // Native TTRUST
    intuintToken: '0x3Aa5ebB10DC797CAC828524e59A333d0A371443c', // INTUINT token (legacy)
  }
}

// Token information
export const TOKENS = {
  tTRUST: {
    symbol: 'tTRUST',
    name: 'Testnet TRUST (Native Token)',
    address: INTUITION_TESTNET.contracts.tTrustToken, // Native token (address(0))
    decimals: 18,
    icon: '⚡',
    color: '#3B82F6',
    isNative: true // This is the native blockchain token
  },
  ORACLE: {
    symbol: 'ORACLE',
    name: 'Oracle Token (ERC20)',
    address: INTUITION_TESTNET.contracts.oracleToken, // Our deployed ERC20 contract
    decimals: 18,
    icon: 'oracle-logo.png',
    color: '#8B5CF6',
    isNative: false // This is our custom ERC20 token
  },
  INTUIT: {
    symbol: 'INTUIT',
    name: 'INTUIT',
    address: INTUITION_TESTNET.contracts.intuintToken,
    decimals: 18,
    icon: '💎',
    color: '#06B6D4',
    isNative: false
  }
} as const

// Protocol constants
export const PROTOCOL_CONFIG = {
  name: 'ORACLE LEND',
  description: 'Over-collateralized lending protocol on Intuition testnet. Deposit ETH as collateral, borrow ORACLE tokens. Based on SpeedRunEthereum challenge with DEX-based price oracle.',
  
  // Lending Protocol Configuration (SpeedRunEthereum model)
  collateralRatio: 120, // 120% collateralization required (over-collateralized)
  liquidationBonus: 10, // 10% liquidation bonus for liquidators
  maxLTV: 83.33, // Max 83.33% LTV (100/120 = 83.33%)
  
  // DEX Configuration (for price oracle)
  tradingFee: 0.3, // 0.3% AMM trading fee
  initialPrice: 500000, // Initial: 1 tTRUST = 500,000 ORACLE (from 10 TTRUST + 5M ORACLE liquidity)
  
  // Contract Balances (from deployment)
  contractBalances: {
    oracleLendSupply: '5000000', // 5M ORACLE tokens available for borrowing
    dexLiquidity: {
      ttrust: '10', // 10 TTRUST in DEX
      oracle: '5000000' // 5M ORACLE in DEX
    }
  },
  
  // Token supplies
  tokenSupply: {
    ORACLE: '10000000', // 10 million ORACLE tokens total
    INTUIT: '1000000' // 1 million INTUIT tokens
  },
  
  // Health factor thresholds
  healthFactor: {
    safe: 150, // >150% is very safe
    warning: 130, // 120-130% is warning zone
    danger: 120, // <120% can be liquidated
    critical: 110 // <110% is critical
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
  
  // New lending-specific errors
  UNSAFE_POSITION_RATIO: 'This action would make your collateral ratio unsafe (below 120%)',
  BORROWING_FAILED: 'Borrowing failed. Check your collateral ratio',
  REPAYING_FAILED: 'Repayment failed. Check your ORACLE token balance and allowance',
  POSITION_SAFE: 'This position is healthy and cannot be liquidated',
  NOT_LIQUIDATABLE: 'This position cannot be liquidated',
  INSUFFICIENT_LIQUIDATOR_ORACLE: 'Insufficient ORACLE tokens to liquidate this position',
  INSUFFICIENT_COLLATERAL: 'Insufficient collateral for this borrow amount',
  NO_DEBT_TO_REPAY: 'No debt to repay',
  CANNOT_LIQUIDATE_SELF: 'You cannot liquidate your own position',
  ORACLE_LIQUIDITY_LOW: 'Insufficient ORACLE tokens available for borrowing',
  
  UNKNOWN_ERROR: 'An unknown error occurred. Please try again'
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  TOKENS_APPROVED: 'Tokens approved successfully',
  
  // Lending-specific success messages
  COLLATERAL_ADDED: 'ETH collateral added successfully',
  COLLATERAL_WITHDRAWN: 'ETH collateral withdrawn successfully',
  BORROW_SUCCESS: 'ORACLE tokens borrowed successfully',
  REPAY_SUCCESS: 'ORACLE debt repaid successfully',
  LIQUIDATION_SUCCESS: 'Position liquidated successfully - bonus earned!',
  
  // DEX success messages
  SWAP_SUCCESS: 'Tokens swapped successfully',
  LIQUIDITY_ADDED: 'Liquidity added successfully',
  LIQUIDITY_REMOVED: 'Liquidity removed successfully'
} as const

// Feature flags
export const FEATURES = {
  enableAnalytics: true,
  enableLending: true, // ETH collateral deposits/withdrawals
  enableBorrowing: true, // ORACLE token borrowing/repaying
  enableSwap: true, // DEX token swapping
  enableLiquidation: true, // Liquidation of unsafe positions (now enabled!)
  enableGovernance: false, // Future feature
  enableStaking: false, // Future feature
  enableMobile: true,
  enableNotifications: true,
  enableDarkMode: true,
  enableAdvancedTrading: false, // Advanced trading features
  enableBatchTransactions: false, // Batch transaction support
  enableHealthMonitoring: true, // Real-time health factor monitoring
  enablePriceAlerts: true, // Price alerts for liquidation risk
  enableAutoLiquidation: true // Auto-liquidation bot integration
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
  // Lending Protocol (OracleLend contract)
  ADD_COLLATERAL: 'addCollateral', // addCollateral() - deposit ETH
  WITHDRAW_COLLATERAL: 'withdrawCollateral', // withdrawCollateral() - withdraw ETH
  BORROW_ORACLE: 'borrowOracle', // borrowOracle() - borrow ORACLE tokens
  REPAY_ORACLE: 'repayOracle', // repayOracle() - repay ORACLE debt
  LIQUIDATE: 'liquidate', // liquidate() - liquidate unsafe position
  
  // DEX Protocol (DEX contract)
  SWAP_TRUST_FOR_ORACLE: 'swapTrustForOracle', // swapTrustForOracle()
  SWAP_ORACLE_FOR_TRUST: 'swapOracleForTrust', // swapOracleForTrust()
  ADD_LIQUIDITY: 'addLiquidity', // addLiquidity()
  REMOVE_LIQUIDITY: 'removeLiquidity', // removeLiquidity()
  
  // Token operations
  APPROVE: 'approve', // ERC20 approve
  TRANSFER: 'transfer', // ERC20 transfer
  
  // Legacy (for backwards compatibility)
  SUPPLY: 'supply', // Deprecated - use ADD_COLLATERAL
  WITHDRAW: 'withdraw', // Deprecated - use WITHDRAW_COLLATERAL
  BORROW: 'borrow', // Deprecated - use BORROW_ORACLE
  REPAY: 'repay', // Deprecated - use REPAY_ORACLE
  SWAP: 'swap', // Deprecated - use specific swap functions
  LIQUIDATION: 'liquidation' // Deprecated - use LIQUIDATE
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
  tableSortOrder: 'desc',
  
  // Lending defaults
  minCollateralETH: '0.01', // Minimum 0.01 ETH collateral
  minBorrowORACLE: '1', // Minimum 1 ORACLE token borrow
  healthFactorRefreshInterval: 10000, // 10 seconds
  priceRefreshInterval: 5000, // 5 seconds for price updates
  
  // Safety margins
  safeCollateralRatio: 150, // Recommend 150% for safety
  warningCollateralRatio: 130 // Warning at 130%
} as const

// Lending-specific constants
export const LENDING_CONFIG = {
  // Contract function names (for ABI calls)
  FUNCTIONS: {
    ADD_COLLATERAL: 'addCollateral',
    WITHDRAW_COLLATERAL: 'withdrawCollateral',
    BORROW_ORACLE: 'borrowOracle',
    REPAY_ORACLE: 'repayOracle',
    LIQUIDATE: 'liquidate',
    GET_CURRENT_PRICE: 'getCurrentPrice',
    GET_USER_POSITION: 'getUserPosition',
    GET_HEALTH_RATIO: 'getHealthRatio',
    IS_LIQUIDATABLE: 'isLiquidatable',
    GET_MAX_BORROW_AMOUNT: 'getMaxBorrowAmount',
    GET_MAX_WITHDRAWABLE_COLLATERAL: 'getMaxWithdrawableCollateral'
  },
  
  // Events to listen for
  EVENTS: {
    COLLATERAL_ADDED: 'CollateralAdded',
    COLLATERAL_WITHDRAWN: 'CollateralWithdrawn',
    ASSET_BORROWED: 'AssetBorrowed',
    ASSET_REPAID: 'AssetRepaid',
    LIQUIDATION: 'Liquidation'
  },
  
  // Position status
  POSITION_STATUS: {
    SAFE: 'safe',        // Health ratio > 150%
    WARNING: 'warning',  // Health ratio 120-150%
    DANGER: 'danger',    // Health ratio < 120% (liquidatable)
    NO_POSITION: 'none'  // No collateral or debt
  }
} as const

export type NetworkStatus = typeof NETWORK_STATUS[keyof typeof NETWORK_STATUS]
export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES]
export type TokenSymbol = keyof typeof TOKENS
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS]
export type PositionStatus = typeof LENDING_CONFIG.POSITION_STATUS[keyof typeof LENDING_CONFIG.POSITION_STATUS]
export type LendingFunction = typeof LENDING_CONFIG.FUNCTIONS[keyof typeof LENDING_CONFIG.FUNCTIONS]
export type LendingEvent = typeof LENDING_CONFIG.EVENTS[keyof typeof LENDING_CONFIG.EVENTS]
