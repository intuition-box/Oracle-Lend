import { useState, useCallback } from 'react'
import { TokenBalance, UserPosition, LendingPool } from '../types'

export const useContract = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data for development - replace with actual contract calls
  const [userPosition, setUserPosition] = useState<UserPosition>({
    supplied: { tTRUST: '0', ORACLE: '0', INTUINT: '0' },
    borrowed: { tTRUST: '0', ORACLE: '0', INTUINT: '0' },
    collateralValue: '0',
    borrowPower: '0',
    healthFactor: 0
  })

  const [lendingPools] = useState<LendingPool[]>([
    {
      token: 'tTRUST',
      totalSupply: '0',
      totalBorrow: '0',
      supplyAPY: 3.5,
      borrowAPY: 8.2,
      utilizationRate: 0
    },
    {
      token: 'ORACLE',
      totalSupply: '0',
      totalBorrow: '0',
      supplyAPY: 4.1,
      borrowAPY: 9.7,
      utilizationRate: 0
    },
    {
      token: 'INTUINT',
      totalSupply: '0',
      totalBorrow: '0',
      supplyAPY: 4.8,
      borrowAPY: 10.2,
      utilizationRate: 0
    }
  ])

  // Supply tokens to lending pool
  const supply = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update user position
      setUserPosition(prev => ({
        ...prev,
        supplied: {
          ...prev.supplied,
          [token]: (parseFloat(prev.supplied[token]) + parseFloat(amount)).toString()
        }
      }))

      return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) }
    } catch (error: any) {
      setError(error.message || 'Supply transaction failed')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Withdraw tokens from lending pool
  const withdraw = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update user position
      setUserPosition(prev => ({
        ...prev,
        supplied: {
          ...prev.supplied,
          [token]: Math.max(0, parseFloat(prev.supplied[token]) - parseFloat(amount)).toString()
        }
      }))

      return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) }
    } catch (error: any) {
      setError(error.message || 'Withdraw transaction failed')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Borrow tokens from lending pool
  const borrow = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update user position
      setUserPosition(prev => ({
        ...prev,
        borrowed: {
          ...prev.borrowed,
          [token]: (parseFloat(prev.borrowed[token]) + parseFloat(amount)).toString()
        }
      }))

      return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) }
    } catch (error: any) {
      setError(error.message || 'Borrow transaction failed')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Repay borrowed tokens
  const repay = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update user position
      setUserPosition(prev => ({
        ...prev,
        borrowed: {
          ...prev.borrowed,
          [token]: Math.max(0, parseFloat(prev.borrowed[token]) - parseFloat(amount)).toString()
        }
      }))

      return { success: true, txHash: '0x' + Math.random().toString(16).substr(2, 64) }
    } catch (error: any) {
      setError(error.message || 'Repay transaction failed')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Swap tokens
  const swap = useCallback(async (
    fromToken: 'tTRUST' | 'ORACLE' | 'INTUINT',
    toToken: 'tTRUST' | 'ORACLE' | 'INTUINT',
    amount: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      // Simulate contract interaction
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Calculate output amount based on 1:100 ratio
      const exchangeRate = fromToken === 'tTRUST' ? 100 : 0.01
      const outputAmount = (parseFloat(amount) * exchangeRate).toString()

      return { 
        success: true, 
        txHash: '0x' + Math.random().toString(16).substr(2, 64),
        outputAmount 
      }
    } catch (error: any) {
      setError(error.message || 'Swap transaction failed')
      return { success: false, error: error.message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get token balances
  const getTokenBalances = useCallback(async (account: string): Promise<TokenBalance> => {
    try {
      // This would connect to real contracts to get actual balances
      // For now, returning 0 so users can see their real wallet balances when connected
      return { tTRUST: '0', ORACLE: '0', INTUINT: '0' }
    } catch (error) {
      console.error('Failed to get token balances:', error)
      return { tTRUST: '0', ORACLE: '0', INTUINT: '0' }
    }
  }, [])

  return {
    userPosition,
    lendingPools,
    isLoading,
    error,
    supply,
    withdraw,
    borrow,
    repay,
    swap,
    getTokenBalances
  }
}
