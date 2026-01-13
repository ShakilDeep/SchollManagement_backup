import { GeminiClient } from '../gemini-client'

export interface InventoryPrediction {
  overallHealth: {
    score: number
    status: 'excellent' | 'good' | 'fair' | 'poor'
    totalValue: number
    assetCount: number
    depreciationRate: number
  }
  maintenancePredictions: {
    assetsNeedingMaintenance: number
    estimatedCost: number
    urgentRepairs: Array<{
      assetCode: string
      name: string
      reason: string
      estimatedCost: number
      urgency: 'high' | 'medium' | 'low'
    }>
    predictedNextMonthCost: number
  }
  replacementNeeds: {
    highPriority: Array<{
      assetCode: string
      name: string
      reason: string
      estimatedCost: number
      recommendedAction: string
    }>
    mediumPriority: Array<{
      assetCode: string
      name: string
      reason: string
      estimatedCost: number
    }>
    totalReplacementBudget: number
    timeFrame: string
  }
  utilizationAnalysis: {
    underutilizedAssets: Array<{
      assetCode: string
      name: string
      category: string
      lastUsed: string
      recommendation: string
    }>
    overutilizedAssets: Array<{
      assetCode: string
      name: string
      category: string
      usageFrequency: number
      recommendation: string
    }>
    utilizationRate: number
    improvementOpportunities: string[]
  }
  categoryInsights: Array<{
    category: string
    assetCount: number
    totalValue: number
    conditionDistribution: Record<string, number>
    averageAge: number
    maintenanceTrend: 'increasing' | 'stable' | 'decreasing'
    recommendations: string[]
  }>
  financialProjections: {
    nextQuarterMaintenanceCost: number
    nextYearDepreciation: number
    totalAssetValueLoss: number
    budgetRecommendations: Array<{
      category: string
      recommendedAmount: number
      reason: string
    }>
  }
  alerts: Array<{
    type: 'urgent' | 'warning' | 'info'
    title: string
    message: string
    action?: string
    priority: 'high' | 'medium' | 'low'
  }>
  insights: {
    keyHighlights: string[]
    opportunities: string[]
    priorities: Array<{
      title: string
      urgency: 'high' | 'medium' | 'low'
      impact: 'high' | 'medium' | 'low'
    }>
  }
  generatedAt: Date
}

export interface InventoryData {
  assets: Array<{
    id: string
    assetCode: string
    name: string
    category: string
    description: string | null
    serialNumber: string | null
    purchaseDate: string | null
    purchasePrice: number | null
    currentValue: number | null
    condition: string
    location: string | null
    assignedTo: string | null
    status: string
    createdAt: string
    updatedAt: string
  }>
  transactions: Array<{
    id: string
    assetId: string
    type: string
    fromLocation: string | null
    toLocation: string | null
    assignedTo: string | null
    quantity: number
    remarks: string | null
    performedBy: string
    createdAt: string
  }>
}

export class InventoryPredictionService {
  private client: GeminiClient

  constructor() {
    this.client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.4,
      maxOutputTokens: 4096
    })
  }

  async predictInventory(data: InventoryData): Promise<InventoryPrediction> {
    const categorySummary = this.getCategorySummary(data.assets)
    const conditionSummary = this.getConditionSummary(data.assets)
    const valueSummary = this.getValueSummary(data.assets)
    const ageSummary = this.getAgeSummary(data.assets)

    const prompt = `
      You are an expert inventory manager and asset management specialist. Analyze the following inventory data:

      INVENTORY OVERVIEW:
      - Total Assets: ${data.assets.length}
      - Total Value: $${valueSummary.totalValue.toLocaleString()}
      - Average Asset Age: ${ageSummary.averageAge.toFixed(1)} years
      - Condition Distribution: ${JSON.stringify(conditionSummary)}

      CATEGORY BREAKDOWN:
      ${Object.entries(categorySummary).map(([category, summary]) => 
        `- ${category}: ${summary.count} assets, $${summary.totalValue.toLocaleString()}, avg age ${summary.averageAge.toFixed(1)} years`
      ).join('\n')}

      CONDITION ANALYSIS:
      ${Object.entries(conditionSummary).map(([condition, count]) => 
        `- ${condition}: ${count} assets (${((count / data.assets.length) * 100).toFixed(1)}%)`
      ).join('\n')}

      RECENT TRANSACTIONS (Last 10):
      ${data.transactions.slice(0, 10).map(t => 
        `- ${t.type}: ${t.assetId} (${t.remarks || 'No remarks'}) on ${new Date(t.createdAt).toLocaleDateString()}`
      ).join('\n')}

      Based on this data, provide comprehensive inventory predictions including:
      1. Overall health score and status
      2. Maintenance predictions with urgent repairs and estimated costs
      3. Replacement needs with priority levels and budget requirements
      4. Utilization analysis identifying underutilized and overutilized assets
      5. Category-specific insights with maintenance trends and recommendations
      6. Financial projections for maintenance costs and depreciation
      7. Actionable alerts with priorities
      8. Key insights, opportunities, and prioritized action items

      Respond in JSON format following the InventoryPrediction interface. Use actual asset codes from the data provided. Make realistic estimates for costs and timing based on asset age, condition, and historical patterns.
    `

    const result = await this.client.generateJSON<InventoryPrediction>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate inventory predictions')
    }

    return {
      ...result.data,
      generatedAt: new Date()
    }
  }

  private getCategorySummary(assets: InventoryData['assets']) {
    const summary: Record<string, { count: number; totalValue: number; averageAge: number }> = {}

    assets.forEach(asset => {
      const age = this.calculateAssetAge(asset.purchaseDate)
      if (!summary[asset.category]) {
        summary[asset.category] = { count: 0, totalValue: 0, averageAge: 0 }
      }
      summary[asset.category].count++
      summary[asset.category].totalValue += asset.currentValue || 0
      summary[asset.category].averageAge = 
        (summary[asset.category].averageAge * (summary[asset.category].count - 1) + age) / summary[asset.category].count
    })

    return summary
  }

  private getConditionSummary(assets: InventoryData['assets']) {
    const summary: Record<string, number> = {}
    assets.forEach(asset => {
      summary[asset.condition] = (summary[asset.condition] || 0) + 1
    })
    return summary
  }

  private getValueSummary(assets: InventoryData['assets']) {
    const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0)
    return { totalValue }
  }

  private getAgeSummary(assets: InventoryData['assets']) {
    const ages = assets
      .filter(asset => asset.purchaseDate)
      .map(asset => this.calculateAssetAge(asset.purchaseDate!))
    
    return {
      averageAge: ages.length > 0 ? ages.reduce((sum, age) => sum + age, 0) / ages.length : 0
    }
  }

  private calculateAssetAge(purchaseDate: string | null): number {
    if (!purchaseDate) return 0
    const now = new Date()
    const purchase = new Date(purchaseDate)
    return (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  }
}

export const inventoryPredictionService = new InventoryPredictionService()
