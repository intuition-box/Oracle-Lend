import { useState, useEffect, useCallback } from 'react'
import { WalletState } from '../types'
import { INTUITION_TESTNET } from '../utils/constants'

export const useWallet = () => {
  // Initialize with potentially cached connection state to reduce flashing
  const [walletState, setWalletState] = useState<WalletState>(() => {
    if (typeof window !== 'undefined') {
      const cachedState = localStorage.getItem('walletState')
      if (cachedState) {
        try {
          const parsed = JSON.parse(cachedState)
          // Only use cached state if it was set recently (within last 10 minutes)
          const cacheTime = localStorage.getItem('walletStateTime')
          if (cacheTime && Date.now() - parseInt(cacheTime) < 10 * 60 * 1000) {
            return parsed
          }
        } catch (e) {
          // Ignore invalid cached state
        }
      }
    }
    return {
      isConnected: false,
      account: null,
      chainId: null,
      balance: '0'
    }
  })

  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true) // Add initialization state
  const [error, setError] = useState<string | null>(null)

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask
  }

  // Cache wallet state to localStorage
  const cacheWalletState = (state: WalletState) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('walletState', JSON.stringify(state))
        localStorage.setItem('walletStateTime', Date.now().toString())
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  // Clear wallet state cache
  const clearWalletStateCache = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('walletState')
        localStorage.removeItem('walletStateTime')
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  // Switch to Intuition testnet
  const switchToIntuitionNetwork = async () => {
    if (!window.ethereum) return false

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${INTUITION_TESTNET.chainId.toString(16)}` }],
      })
      return true
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${INTUITION_TESTNET.chainId.toString(16)}`,
                chainName: INTUITION_TESTNET.name,
                nativeCurrency: INTUITION_TESTNET.nativeCurrency,
                rpcUrls: [INTUITION_TESTNET.rpcUrl],
                blockExplorerUrls: [INTUITION_TESTNET.blockExplorer],
              },
            ],
          })
          return true
        } catch (addError) {
          return false
        }
      }
      return false
    }
  }

  // Get account balance
  const getBalance = async (account: string) => {
    if (!window.ethereum) return '0'

    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest'],
      })
      // Convert from wei to ether (18 decimals)
      const balanceInEther = parseInt(balance, 16) / Math.pow(10, 18)
      return balanceInEther.toString()
    } catch (error) {
      return '0'
    }
  }

  // Refresh balance function
  const refreshBalance = async () => {
    if (walletState.account) {
      const newBalance = await getBalance(walletState.account)
      setWalletState(prev => ({
        ...prev,
        balance: newBalance
      }))
    }
  }

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask is not installed. Please install MetaMask to continue.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length === 0) {
        throw new Error('No accounts found')
      }

      // Get current chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      })

      const currentChainId = parseInt(chainId, 16)
      
      // Switch to Intuition testnet if not already connected
      if (currentChainId !== INTUITION_TESTNET.chainId) {
        const switched = await switchToIntuitionNetwork()
        if (!switched) {
          throw new Error('Failed to switch to Intuition testnet')
        }
      }

      const account = accounts[0]
      const balance = await getBalance(account)

      const newState = {
        isConnected: true,
        account,
        chainId: INTUITION_TESTNET.chainId,
        balance
      }
      setWalletState(newState)
      cacheWalletState(newState)

    } catch (error: any) {
      setError(error.message || 'Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    const newState = {
      isConnected: false,
      account: null,
      chainId: null,
      balance: '0'
    }
    setWalletState(newState)
    clearWalletStateCache()
    setError(null)
  }, [])

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else {
        setWalletState(prev => ({
          ...prev,
          account: accounts[0]
        }))
      }
    }

    const handleChainChanged = (chainId: string) => {
      const newChainId = parseInt(chainId, 16)
      setWalletState(prev => ({
        ...prev,
        chainId: newChainId
      }))
      
      // If switched away from Intuition testnet, show warning
      if (newChainId !== INTUITION_TESTNET.chainId) {
        setError('Please switch back to Intuition testnet to continue using the app')
      } else {
        setError(null)
      }
    }

    window.ethereum.on('accountsChanged', handleAccountsChanged)
    window.ethereum.on('chainChanged', handleChainChanged)

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      window.ethereum.removeListener('chainChanged', handleChainChanged)
    }
  }, [disconnect])

  // Check if already connected on mount
  useEffect(() => {
    let retryCount = 0
    const maxRetries = 3
    
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) {
        setIsInitializing(false)
        return
      }

      try {
        // Add a delay to ensure MetaMask is fully loaded
        await new Promise(resolve => setTimeout(resolve, Math.min(100 + retryCount * 100, 500)))
        
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })

        if (accounts && accounts.length > 0) {
          
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          })
          
          const currentChainId = parseInt(chainId, 16)
          const balance = await getBalance(accounts[0])

          const newState = {
            isConnected: true,
            account: accounts[0],
            chainId: currentChainId,
            balance
          }
          setWalletState(newState)
          cacheWalletState(newState)

          // Show warning if not on Intuition testnet
          if (currentChainId !== INTUITION_TESTNET.chainId) {
            setError('Please switch to Intuition testnet to use the app')
          } else {
            setError(null)
          }
        } else {
        }
      } catch (error) {
        
        // Retry if we haven't reached max retries and it's a potentially transient error
        if (retryCount < maxRetries && (error as any)?.code !== 4001) {
          retryCount++
          setTimeout(() => checkConnection(), 500)
          return
        }
      } finally {
        // Only set initializing to false if we're not retrying
        if (retryCount >= maxRetries || !error) {
          setIsInitializing(false)
        }
      }
    }

    // Start the initial check with a delay
    const timeoutId = setTimeout(() => {
      checkConnection()
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [])

  return {
    ...walletState,
    isLoading,
    isInitializing,
    error,
    connect,
    disconnect,
    refreshBalance,
    switchToIntuitionNetwork,
    isMetaMaskInstalled: isMetaMaskInstalled()
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
