export interface WalletState {
  isConnected: boolean
  account: string | null
  chainId: number | null
  balance: string
}

export interface TokenBalance {
  tTRUST: string
  ORACLE: string
  INTUIT: string
}

export interface LendingPool {
  token: 'tTRUST' | 'ORACLE' | 'INTUIT'
  totalSupply: string
  totalBorrow: string
  supplyAPY: number
  borrowAPY: number
  utilizationRate: number
}

export interface UserPosition {
  supplied: TokenBalance
  borrowed: TokenBalance
  collateralValue: string
  borrowPower: string
  healthFactor: number
}

export interface AnalyticsData {
  totalTransactions: number
  uniqueWallets: number
  totalTVL: {
    tTRUST: string
    ORACLE: string
    INTUIT: string
    usd: string
  }
  volume24h: string
  totalBorrowed: string
  dailySwaps: number
  swapVolume24h: string
  totalSwaps: number
  avgTradeSize: string
  activeLenders: number
  activeBorrowers: number
  newUsers24h: number
  activeUsers24h: number
  chartData: Array<{ timestamp: number; value: string }>
  recentTransactions: Array<{
    type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'swap'
    user: string
    amount: string
    time: string
    icon: string
    color: string
    txHash: string
  }>
  timestamp: number
}

export interface SwapQuote {
  inputAmount: string
  outputAmount: string
  priceImpact: number
  minimumReceived: string
  exchangeRate: number
}

export interface Transaction {
  hash: string
  type: 'supply' | 'borrow' | 'withdraw' | 'repay' | 'swap'
  amount: string
  token: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}
