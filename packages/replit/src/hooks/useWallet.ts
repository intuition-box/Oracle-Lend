import { useState, useEffect, useCallback } from 'react'
import { WalletState } from '../types'
import { INTUITION_TESTNET } from '../utils/constants'

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: null,
    chainId: null,
    balance: '0'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && window.ethereum && window.ethereum.isMetaMask
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
          console.error('Failed to add network:', addError)
          return false
        }
      }
      console.error('Failed to switch network:', switchError)
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
      console.error('Failed to get balance:', error)
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

      setWalletState({
        isConnected: true,
        account,
        chainId: INTUITION_TESTNET.chainId,
        balance
      })

    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      setError(error.message || 'Failed to connect wallet')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletState({
      isConnected: false,
      account: null,
      chainId: null,
      balance: '0'
    })
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
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return

      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })

        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({
            method: 'eth_chainId',
          })
          
          const currentChainId = parseInt(chainId, 16)
          const balance = await getBalance(accounts[0])

          setWalletState({
            isConnected: true,
            account: accounts[0],
            chainId: currentChainId,
            balance
          })

          // Show warning if not on Intuition testnet
          if (currentChainId !== INTUITION_TESTNET.chainId) {
            setError('Please switch to Intuition testnet to use the app')
          }
        }
      } catch (error) {
        console.error('Failed to check connection:', error)
      }
    }

    checkConnection()
  }, [])

  return {
    ...walletState,
    isLoading,
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
