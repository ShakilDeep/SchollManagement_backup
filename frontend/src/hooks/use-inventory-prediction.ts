import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { InventoryPrediction, InventoryBatchPrediction } from '@/lib/ai/services/inventory-prediction-service'

export function useInventoryPrediction(assetId: string) {
  return useQuery<InventoryPrediction>({
    queryKey: ['inventory-prediction', assetId],
    queryFn: async () => {
      const params = new URLSearchParams({ assetId })
      
      const response = await fetch(`/api/inventory/prediction?${params}`)
      if (!response.ok) throw new Error('Failed to fetch prediction')
      return response.json()
    },
    enabled: !!assetId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}

export function useBatchInventoryPrediction(category?: string) {
  return useQuery<{
    predictions: InventoryPrediction[]
    summary: {
      total: number
      immediateMaintenance: number
      highStockOutRisk: number
      replaceNow: number
      averageConfidence: number
    }
  }>({
    queryKey: ['batch-inventory-prediction', category],
    queryFn: async () => {
      const params = new URLSearchParams({ type: 'batch' })
      
      if (category) params.append('category', category)
      
      const response = await fetch(`/api/inventory/prediction?${params}`)
      if (!response.ok) throw new Error('Failed to fetch batch predictions')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  })
}
