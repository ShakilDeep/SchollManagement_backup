import { InventoryPrediction } from '@/lib/ai/services/inventory-prediction-service'
import { Wrench, TrendingDown, AlertTriangle, Activity, RefreshCw, Clock, Minus, CheckCircle } from 'lucide-react'

interface InventoryPredictionBadgeProps {
  prediction: InventoryPrediction | null
  isLoading?: boolean
}

export function InventoryPredictionBadge({ prediction, isLoading }: InventoryPredictionBadgeProps) {
  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 text-xs">
        <Clock className="w-3.5 h-3.5 animate-spin" />
        <span>Loading...</span>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-400 text-xs">
        <Minus className="w-3.5 h-3.5" />
        <span>No data</span>
      </div>
    )
  }

  const hasRisks = prediction.predictedMaintenance !== 'Not Needed' ||
                    prediction.predictedDepreciation > 80 ||
                    prediction.stockOutRisk === 'high' ||
                    prediction.demandForecast === 'increasing' ||
                    prediction.replacementRecommendation === 'Replace Now'

  if (!hasRisks) {
    const avgConfidence = (
      prediction.maintenanceConfidence +
      prediction.depreciationConfidence +
      prediction.stockOutConfidence +
      prediction.demandConfidence +
      prediction.replacementConfidence
    ) / 5

    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-200 text-xs">
        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
        <span className="text-green-600">Stable</span>
        <span className="font-bold text-gray-700">{Math.round(avgConfidence * 100)}%</span>
      </div>
    )
  }

  const activePredictions = []

  if (prediction.predictedMaintenance !== 'Not Needed') {
    activePredictions.push({
      key: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      confidence: prediction.maintenanceConfidence
    })
  }

  if (prediction.predictedDepreciation > 80) {
    activePredictions.push({
      key: 'depreciation',
      label: 'Depreciation',
      icon: TrendingDown,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      confidence: prediction.depreciationConfidence
    })
  }

  if (prediction.stockOutRisk !== 'low') {
    activePredictions.push({
      key: 'stockOut',
      label: 'Stock-Out',
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      confidence: prediction.stockOutConfidence
    })
  }

  if (prediction.demandForecast === 'increasing') {
    activePredictions.push({
      key: 'demand',
      label: 'Demand',
      icon: Activity,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      confidence: prediction.demandConfidence
    })
  }

  if (prediction.replacementRecommendation === 'Replace Now' || prediction.replacementRecommendation === 'Replace Soon') {
    activePredictions.push({
      key: 'replacement',
      label: 'Replacement',
      icon: RefreshCw,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      confidence: prediction.replacementConfidence
    })
  }

  const hasRiskFactors = prediction.riskFactors.length > 0

  return (
    <div className="space-y-1.5 max-w-[200px]">
      <div className="flex flex-wrap gap-1">
        {activePredictions.slice(0, 2).map(p => {
          const Icon = p.icon
          const confidencePercent = Math.round(p.confidence * 100)

          return (
            <div key={p.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${p.bg} ${p.border} border text-[10px]`}>
              <Icon className={`w-3 h-3 ${p.color}`} />
              <span className={p.color}>{p.label}</span>
              <span className="font-bold text-gray-700">{confidencePercent}%</span>
            </div>
          )
        })}
      </div>

      {activePredictions.length > 2 && (
        <div className="text-xs text-gray-500 text-center">
          +{activePredictions.length - 2} more
        </div>
      )}

      {hasRiskFactors && (
        <div className="text-xs text-gray-500 space-y-0.5">
          <ul className="pl-2 space-y-0.5">
            {prediction.riskFactors.slice(0, 1).map((factor, idx) => (
              <li key={idx} className="flex items-start gap-1 text-[10px] leading-tight">
                <span className="text-orange-500 mt-0.5">•</span>
                <span className="text-gray-600">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
