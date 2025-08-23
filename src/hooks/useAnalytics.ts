import { useState, useEffect } from 'react'
import { AnalyticsData } from '../types'

export const useAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalTransactions: 0,
    uniqueWallets: 0,
    totalTVL: {
      tTRUST: '0',
      ORACLE: '0',
      usd: '0'
    },
    volume24h: '0',
    timestamp: Date.now()
  })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simulate real-time analytics updates
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true)
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate realistic analytics data
        const baseTransactions = 15847
        const baseWallets = 2156
        const baseTVLtTRUST = 1250000
        const baseTVLORACLE = 125000000
        
        // Add some randomness to simulate real-time updates
        const variation = () => Math.random() * 0.02 - 0.01 // ±1% variation
        
        setAnalytics({
          totalTransactions: Math.floor(baseTransactions * (1 + variation())),
          uniqueWallets: Math.floor(baseWallets * (1 + variation())),
          totalTVL: {
            tTRUST: (baseTVLtTRUST * (1 + variation())).toFixed(2),
            ORACLE: (baseTVLORACLE * (1 + variation())).toFixed(2),
            usd: ((baseTVLtTRUST * 2500 + baseTVLORACLE * 25) * (1 + variation())).toFixed(2)
          },
          volume24h: (1250000 * (1 + variation())).toFixed(2),
          timestamp: Date.now()
        })
        
        setError(null)
      } catch (err: any) {
        setError(err.message || 'Failed to fetch analytics data')
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchAnalytics()

    // Update every 30 seconds to simulate real-time data
    const interval = setInterval(fetchAnalytics, 30000)

    return () => clearInterval(interval)
  }, [])

  // Manual refresh function
  const refreshAnalytics = async () => {
    setIsLoading(true)
    
    // Simulate refresh delay
    setTimeout(() => {
      setAnalytics(prev => ({
        ...prev,
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 5),
        timestamp: Date.now()
      }))
      setIsLoading(false)
    }, 1000)
  }

  return {
    analytics,
    isLoading,
    error,
    refreshAnalytics
  }
}
