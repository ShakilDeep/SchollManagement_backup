export interface InventoryPrediction {
  assetSummary: {
    total: number
    available: number
    inUse: number
    maintenance: number
    retired: number
    utilizationRate: number
  }
  conditionAnalysis: {
    excellent: number
    good: number
    fair: number
    poor: number
    replacementCandidates: AssetRisk[]
  }
  valueAnalysis: {
    totalValue: number
    purchaseValue: number
    depreciationRate: number
    highValueAssets: number
    categoryValueDistribution: CategoryValue[]
  }
  locationDistribution: LocationAllocation[]
  utilizationInsights: {
    underutilizedAssets: AssetInfo[]
    overutilizedCategories: CategoryUsage[]
    idleTimeDays: number
  }
  recommendations: Recommendation[]
}

export interface AssetRisk {
  id: string
  name: string
  category: string
  condition: string
  currentValue: number | null
  reason: string
}

export interface CategoryValue {
  category: string
  totalValue: number
  count: number
  percentage: number
}

export interface LocationAllocation {
  location: string
  count: number
  value: number
  allocationRate: string
}

export interface CategoryUsage {
  category: string
  inUse: number
  total: number
  utilizationRate: number
}

export interface AssetInfo {
  id: string
  name: string
  category: string
  location: string | null
  status: string
}

export interface Recommendation {
  title: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  priority: 'low' | 'medium' | 'high'
}
