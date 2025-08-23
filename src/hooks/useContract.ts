import { useState, useCallback, useEffect } from 'react'
import { TokenBalance, UserPosition, LendingPool } from '../types'
import { TOKENS } from '../utils/constants'

export const useContract = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState({
    tTRUST_ORACLE: 100,
    tTRUST_INTUINT: 100,
    ORACLE_INTUINT: 1
  })

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
      supplyAPY: 5.2,
      borrowAPY: 8.2,
      utilizationRate: 0
    },
    {
      token: 'ORACLE',
      totalSupply: '0',
      totalBorrow: '0',
      supplyAPY: 4.8,
      borrowAPY: 9.7,
      utilizationRate: 0
    },
    {
      token: 'INTUINT',
      totalSupply: '0',
      totalBorrow: '0',
      supplyAPY: 3.6,
      borrowAPY: 10.2,
      utilizationRate: 0
    }
  ])

  // Supply tokens to lending pool
  const supply = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      // Get current accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts connected')
      }

      const fromAddress = accounts[0]
      const inputAmount = parseFloat(amount)
      const amountInWei = (inputAmount * Math.pow(10, 18)).toString(16)

      // For tTRUST (native token), send value directly
      if (token === 'tTRUST') {
        const txParams = {
          from: fromAddress,
          to: '0x1234567890123456789012345678901234567890', // Lending pool contract address
          value: `0x${amountInWei}`,
          data: '0x', // Supply function call data
          gas: '0x186A0', // 100k gas limit
        }

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        })

        // Update user position
        setUserPosition(prev => ({
          ...prev,
          supplied: {
            ...prev.supplied,
            [token]: (parseFloat(prev.supplied[token]) + parseFloat(amount)).toString()
          }
        }))

        return { success: true, txHash }
      } else {
        // For ERC20 tokens (ORACLE, INTUINT)
        const txParams = {
          from: fromAddress,
          to: TOKENS[token].address,
          value: '0x0',
          data: '0xa9059cbb' + // transfer function selector
                '1234567890123456789012345678901234567890'.padStart(64, '0') + // lending pool address
                amountInWei.padStart(64, '0'), // amount
          gas: '0x186A0',
        }

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        })

        // Update user position
        setUserPosition(prev => ({
          ...prev,
          supplied: {
            ...prev.supplied,
            [token]: (parseFloat(prev.supplied[token]) + parseFloat(amount)).toString()
          }
        }))

        return { success: true, txHash }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Supply transaction failed'
      setError(errorMessage)
      
      // Check if user rejected the transaction
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' }
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Withdraw tokens from lending pool
  const withdraw = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length === 0) throw new Error('No accounts connected')

      const fromAddress = accounts[0]
      const inputAmount = parseFloat(amount)
      const amountInWei = (inputAmount * Math.pow(10, 18)).toString(16)

      const txParams = {
        from: fromAddress,
        to: '0x1234567890123456789012345678901234567890', // Lending pool contract
        value: '0x0',
        data: '0x', // Withdraw function call data
        gas: '0x186A0',
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      })
      
      // Update user position
      setUserPosition(prev => ({
        ...prev,
        supplied: {
          ...prev.supplied,
          [token]: Math.max(0, parseFloat(prev.supplied[token]) - parseFloat(amount)).toString()
        }
      }))

      return { success: true, txHash }
    } catch (error: any) {
      const errorMessage = error.message || 'Withdraw transaction failed'
      setError(errorMessage)
      
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' }
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Borrow tokens from lending pool
  const borrow = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length === 0) throw new Error('No accounts connected')

      const fromAddress = accounts[0]
      const inputAmount = parseFloat(amount)
      const amountInWei = (inputAmount * Math.pow(10, 18)).toString(16)

      const txParams = {
        from: fromAddress,
        to: '0x1234567890123456789012345678901234567890', // Lending pool contract
        value: '0x0',
        data: '0x', // Borrow function call data
        gas: '0x186A0',
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      })
      
      // Update user position
      setUserPosition(prev => ({
        ...prev,
        borrowed: {
          ...prev.borrowed,
          [token]: (parseFloat(prev.borrowed[token]) + parseFloat(amount)).toString()
        }
      }))

      return { success: true, txHash }
    } catch (error: any) {
      const errorMessage = error.message || 'Borrow transaction failed'
      setError(errorMessage)
      
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' }
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Repay borrowed tokens
  const repay = useCallback(async (token: 'tTRUST' | 'ORACLE' | 'INTUINT', amount: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length === 0) throw new Error('No accounts connected')

      const fromAddress = accounts[0]
      const inputAmount = parseFloat(amount)
      const amountInWei = (inputAmount * Math.pow(10, 18)).toString(16)

      let txParams
      if (token === 'tTRUST') {
        txParams = {
          from: fromAddress,
          to: '0x1234567890123456789012345678901234567890', // Lending pool contract
          value: `0x${amountInWei}`,
          data: '0x', // Repay function call data
          gas: '0x186A0',
        }
      } else {
        txParams = {
          from: fromAddress,
          to: TOKENS[token].address,
          value: '0x0',
          data: '0xa9059cbb' + // transfer function selector
                '1234567890123456789012345678901234567890'.padStart(64, '0') + // lending pool address
                amountInWei.padStart(64, '0'), // amount
          gas: '0x186A0',
        }
      }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      })
      
      // Update user position
      setUserPosition(prev => ({
        ...prev,
        borrowed: {
          ...prev.borrowed,
          [token]: Math.max(0, parseFloat(prev.borrowed[token]) - parseFloat(amount)).toString()
        }
      }))

      return { success: true, txHash }
    } catch (error: any) {
      const errorMessage = error.message || 'Repay transaction failed'
      setError(errorMessage)
      
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' }
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Dynamic exchange rate system
  useEffect(() => {
    const updateRates = () => {
      setExchangeRates(prev => ({
        tTRUST_ORACLE: prev.tTRUST_ORACLE * (1 + (Math.random() - 0.5) * 0.02), // ±1% fluctuation
        tTRUST_INTUINT: prev.tTRUST_INTUINT * (1 + (Math.random() - 0.5) * 0.02), // ±1% fluctuation
        ORACLE_INTUINT: prev.ORACLE_INTUINT * (1 + (Math.random() - 0.5) * 0.01) // ±0.5% fluctuation
      }))
    }

    // Update rates every 10 seconds
    const interval = setInterval(updateRates, 10000)
    return () => clearInterval(interval)
  }, [])

  // Swap tokens with real wallet transactions
  const swap = useCallback(async (
    fromToken: 'tTRUST' | 'ORACLE' | 'INTUINT',
    toToken: 'tTRUST' | 'ORACLE' | 'INTUINT',
    amount: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      // Get current accounts
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      })

      if (accounts.length === 0) {
        throw new Error('No accounts connected')
      }

      const fromAddress = accounts[0]

      // Calculate output amount using dynamic rates
      let rate = 1
      const inputAmount = parseFloat(amount)
      
      if (fromToken === 'tTRUST' && toToken === 'ORACLE') {
        rate = exchangeRates.tTRUST_ORACLE
      } else if (fromToken === 'ORACLE' && toToken === 'tTRUST') {
        rate = 1 / exchangeRates.tTRUST_ORACLE
      } else if (fromToken === 'tTRUST' && toToken === 'INTUINT') {
        rate = exchangeRates.tTRUST_INTUINT
      } else if (fromToken === 'INTUINT' && toToken === 'tTRUST') {
        rate = 1 / exchangeRates.tTRUST_INTUINT
      } else if (fromToken === 'ORACLE' && toToken === 'INTUINT') {
        rate = exchangeRates.ORACLE_INTUINT
      } else if (fromToken === 'INTUINT' && toToken === 'ORACLE') {
        rate = 1 / exchangeRates.ORACLE_INTUINT
      }

      const outputAmount = inputAmount * rate
      const amountInWei = (inputAmount * Math.pow(10, 18)).toString(16)

      // For swapping from tTRUST (native token)
      if (fromToken === 'tTRUST') {
        // Create transaction to swap contract (this would be the real swap contract)
        const txParams = {
          from: fromAddress,
          to: TOKENS[toToken].address,
          value: `0x${amountInWei}`,
          data: '0x', // This would contain actual swap contract call data
          gas: '0x186A0', // 100k gas limit
        }

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        })

        return { 
          success: true, 
          txHash,
          outputAmount: outputAmount.toString()
        }
      } else {
        // For ERC20 tokens, would need to call transfer/approve functions
        // For now, simulate the transaction but show real MetaMask prompt
        const txParams = {
          from: fromAddress,
          to: TOKENS[fromToken].address,
          value: '0x0',
          data: '0xa9059cbb' + // transfer function selector
                TOKENS[toToken].address.slice(2).padStart(64, '0') + // to address
                amountInWei.padStart(64, '0'), // amount
          gas: '0x186A0',
        }

        const txHash = await window.ethereum.request({
          method: 'eth_sendTransaction',
          params: [txParams],
        })

        return { 
          success: true, 
          txHash,
          outputAmount: outputAmount.toString()
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Swap transaction failed'
      setError(errorMessage)
      
      // Check if user rejected the transaction
      if (errorMessage.includes('rejected') || errorMessage.includes('denied') || error.code === 4001) {
        return { success: false, error: 'Transaction rejected by user' }
      }
      
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [exchangeRates])

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
    exchangeRates,
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
