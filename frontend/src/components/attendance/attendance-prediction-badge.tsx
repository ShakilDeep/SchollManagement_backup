import { AttendancePrediction } from '@/lib/ai/services/attendance-prediction-service'
import { Check, X, Clock, Minus, AlertCircle } from 'lucide-react'

interface AttendancePredictionBadgeProps {
  prediction: AttendancePrediction | null
  isLoading?: boolean
}

export function AttendancePredictionBadge({ prediction, isLoading }: AttendancePredictionBadgeProps) {
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

  const statusConfig = {
    Present: {
      icon: Check,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200'
    },
    Absent: {
      icon: X,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200'
    },
    Late: {
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    },
    HalfDay: {
      icon: Minus,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200'
    }
  }

  const config = statusConfig[prediction.predictedStatus]
  const Icon = config.icon
  const hasRiskFactors = prediction.riskFactors.some(f => f !== 'No significant risk factors')
  const confidencePercent = Math.round(prediction.confidence * 100)

  return (
    <div className="space-y-1.5">
      {/* Main prediction badge with confidence shown directly */}
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} ${config.border} border text-xs`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className={config.color}>{prediction.predictedStatus}</span>
        <span className="font-bold text-gray-700">
          {confidencePercent}%
        </span>
      </div>

      {/* Risk factors shown directly below */}
      {hasRiskFactors && (
        <div className="text-xs text-gray-500 space-y-0.5 max-w-[180px]">
          <p className="font-medium text-gray-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-orange-500" />
            Risk Factors:
          </p>
          <ul className="pl-3 space-y-0.5">
            {prediction.riskFactors.slice(0, 2).map((factor, idx) => (
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
