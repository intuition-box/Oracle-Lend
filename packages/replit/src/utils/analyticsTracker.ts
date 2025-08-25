// Analytics tracker to store real transaction data for protocol analytics

export interface TrackedTransaction {
  hash: string
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'swap'
  user: string
  token: string
  amount: string
  volume?: string // For swaps
  timestamp: number
}

export interface TrackedUser {
  address: string
  firstSeen: number
  lastSeen: number
}

// Track a transaction for analytics
export const trackTransaction = (
  hash: string,
  type: 'supply' | 'withdraw' | 'borrow' | 'repay' | 'swap',
  user: string,
  token: string,
  amount: string,
  volumeUSD?: string
) => {
  try {
    // Track the transaction
    const transaction: TrackedTransaction = {
      hash,
      type,
      user,
      token,
      amount,
      volume: volumeUSD,
      timestamp: Date.now()
    }

    const storedTransactions = JSON.parse(localStorage.getItem('protocol_transactions') || '[]')
    storedTransactions.push(transaction)
    localStorage.setItem('protocol_transactions', JSON.stringify(storedTransactions))

    // Track user
    trackUser(user)

    // Track specific action types
    if (type === 'swap') {
      trackSwap(transaction)
    } else if (type === 'supply' || type === 'withdraw') {
      trackLending(transaction)
    } else if (type === 'borrow' || type === 'repay') {
      trackBorrowing(transaction)
    }

    // Update lending pools
    updateLendingPools(type, token, amount)

    console.log(`📊 Analytics: Tracked ${type} transaction for ${amount} ${token}`)
  } catch (error) {
    console.error('Failed to track transaction:', error)
  }
}

// Track a user for analytics
const trackUser = (address: string) => {
  const storedUsers: TrackedUser[] = JSON.parse(localStorage.getItem('protocol_users') || '[]')
  const existingUser = storedUsers.find(user => user.address === address)
  
  if (existingUser) {
    existingUser.lastSeen = Date.now()
  } else {
    storedUsers.push({
      address,
      firstSeen: Date.now(),
      lastSeen: Date.now()
    })
  }
  
  localStorage.setItem('protocol_users', JSON.stringify(storedUsers))
}

// Track swap for swap-specific analytics
const trackSwap = (transaction: TrackedTransaction) => {
  const storedSwaps = JSON.parse(localStorage.getItem('protocol_swaps') || '[]')
  storedSwaps.push(transaction)
  localStorage.setItem('protocol_swaps', JSON.stringify(storedSwaps))
}

// Track lending activity
const trackLending = (transaction: TrackedTransaction) => {
  const storedLending = JSON.parse(localStorage.getItem('protocol_lending') || '[]')
  storedLending.push(transaction)
  localStorage.setItem('protocol_lending', JSON.stringify(storedLending))
}

// Track borrowing activity
const trackBorrowing = (transaction: TrackedTransaction) => {
  const storedBorrowing = JSON.parse(localStorage.getItem('protocol_borrowing') || '[]')
  storedBorrowing.push(transaction)
  localStorage.setItem('protocol_borrowing', JSON.stringify(storedBorrowing))
}

// Update lending pool sizes for TVL calculation
const updateLendingPools = (
  type: string,
  token: string,
  amount: string
) => {
  const pools = JSON.parse(localStorage.getItem('lending_pools') || JSON.stringify([
    { token: 'tTRUST', totalSupply: '0', totalBorrow: '0' },
    { token: 'ORACLE', totalSupply: '0', totalBorrow: '0' },
    { token: 'INTUIT', totalSupply: '0', totalBorrow: '0' }
  ]))

  const pool = pools.find((p: any) => p.token === token)
  if (!pool) return

  const amountFloat = parseFloat(amount)
  
  switch (type) {
    case 'supply':
      pool.totalSupply = (parseFloat(pool.totalSupply) + amountFloat).toString()
      break
    case 'withdraw':
      pool.totalSupply = Math.max(0, parseFloat(pool.totalSupply) - amountFloat).toString()
      break
    case 'borrow':
      pool.totalBorrow = (parseFloat(pool.totalBorrow) + amountFloat).toString()
      break
    case 'repay':
      pool.totalBorrow = Math.max(0, parseFloat(pool.totalBorrow) - amountFloat).toString()
      break
  }

  localStorage.setItem('lending_pools', JSON.stringify(pools))
}

// Initialize analytics data on first load
export const initializeAnalytics = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage not available for analytics')
      return
    }

    if (!localStorage.getItem('protocol_transactions')) {
      localStorage.setItem('protocol_transactions', JSON.stringify([]))
    }
    if (!localStorage.getItem('protocol_users')) {
      localStorage.setItem('protocol_users', JSON.stringify([]))
    }
    if (!localStorage.getItem('protocol_swaps')) {
      localStorage.setItem('protocol_swaps', JSON.stringify([]))
    }
    if (!localStorage.getItem('protocol_lending')) {
      localStorage.setItem('protocol_lending', JSON.stringify([]))
    }
    if (!localStorage.getItem('protocol_borrowing')) {
      localStorage.setItem('protocol_borrowing', JSON.stringify([]))
    }
    if (!localStorage.getItem('lending_pools')) {
      localStorage.setItem('lending_pools', JSON.stringify([
        { token: 'tTRUST', totalSupply: '0', totalBorrow: '0' },
        { token: 'ORACLE', totalSupply: '0', totalBorrow: '0' },
        { token: 'INTUIT', totalSupply: '0', totalBorrow: '0' }
      ]))
    }
  } catch (error) {
    console.error('Failed to initialize analytics:', error)
  }
}

// Get current analytics summary (for debugging)
export const getAnalyticsSummary = () => {
  const transactions = JSON.parse(localStorage.getItem('protocol_transactions') || '[]')
  const users = JSON.parse(localStorage.getItem('protocol_users') || '[]')
  const swaps = JSON.parse(localStorage.getItem('protocol_swaps') || '[]')
  const pools = JSON.parse(localStorage.getItem('lending_pools') || '[]')
  
  return {
    totalTransactions: transactions.length,
    totalUsers: users.length,
    totalSwaps: swaps.length,
    pools: pools
  }
}