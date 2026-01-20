import { NextRequest, NextResponse } from 'next/server'
import { inventoryPredictionService } from '@/lib/ai/services/inventory-prediction-service'
import { fetchAPI } from '@/lib/api/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const assetId = searchParams.get('assetId')
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    if (type === 'batch') {
      return await handleBatchPrediction(category)
    }

    if (!assetId) {
      return NextResponse.json(
        { error: 'assetId parameter is required' },
        { status: 400 }
      )
    }

    const prediction = await inventoryPredictionService.predictInventoryForAsset(assetId)

    if (!prediction) {
      return NextResponse.json(
        { error: 'Unable to generate prediction' },
        { status: 404 }
      )
    }

    return NextResponse.json(prediction)
  } catch (error) {
    console.error('Inventory prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}

async function handleBatchPrediction(category: string | null) {
  const queryParams: Record<string, string> = {}
  if (category) queryParams.category = category

  const response = await fetchAPI<{ results: any[] }>('/inventory/', { query: queryParams })
  const assets = response.results || []

  const assetIds = assets.map((a: any) => a.id).slice(0, 50)
  const batchPrediction = await inventoryPredictionService.predictBatchInventory(assetIds)

  return NextResponse.json({
    predictions: batchPrediction.predictions,
    summary: {
      total: batchPrediction.summary.totalAssets,
      immediateMaintenance: batchPrediction.summary.immediateMaintenance,
      highStockOutRisk: batchPrediction.summary.highStockOutRisk,
      replaceNow: batchPrediction.summary.replaceNow,
      averageConfidence: batchPrediction.summary.averageConfidence
    }
  })
}
