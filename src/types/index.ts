export interface WalletState {
  isConnected: boolean
  account: string | null
  chainId: number | null
  balance: string
}

export interface TokenBalance {
  tTRUST: string
  ORACLE: string
}

export interface LendingPool {
  token: 'tTRUST' | 'ORACLE'
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
    usd: string
  }
  volume24h: string
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
