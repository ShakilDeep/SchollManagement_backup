import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, DollarSign, Wrench, Package, Activity, BarChart3, Bell, ArrowUpRight, ArrowDownRight, Calendar, Clock } from 'lucide-react'
import { InventoryPrediction } from '@/lib/ai/types'

interface AIPredictionsCardProps {
  predictions: InventoryPrediction | null
  isLoading?: boolean
}

export default function AIPredictionsCard({ predictions, isLoading }: AIPredictionsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            AI-Powered Inventory Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!predictions) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Unable to load AI predictions</p>
          <p className="text-sm text-slate-400 mt-2">Insufficient inventory data available</p>
        </CardContent>
      </Card>
    )
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'text-rose-600 bg-rose-50 border-rose-200'
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'fair':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'poor':
        return 'text-rose-600 bg-rose-50 border-rose-200'
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'text-rose-600 bg-rose-50'
      case 'medium':
        return 'text-amber-600 bg-amber-50'
      case 'low':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-600 rounded-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI-Powered Inventory Insights</h2>
            <p className="text-sm text-slate-500">
              Generated at {new Date(predictions.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className={getHealthColor(predictions.overallHealth.status)}>
          {predictions.overallHealth.status.charAt(0).toUpperCase() + predictions.overallHealth.status.slice(1)} Health
        </Badge>
      </div>

      {predictions.alerts.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-500" />
              Important Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predictions.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                >
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                    {alert.action && (
                      <Badge
                        variant="outline"
                        className={`mt-1 text-xs ${
                          alert.type === 'urgent'
                            ? 'border-rose-300 text-rose-600'
                            : alert.type === 'warning'
                            ? 'border-amber-300 text-amber-600'
                            : 'border-blue-300 text-blue-600'
                        }`}
                      >
                        {alert.action}
                      </Badge>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      alert.priority === 'high'
                        ? 'border-rose-300 text-rose-600'
                        : alert.priority === 'medium'
                        ? 'border-amber-300 text-amber-600'
                        : 'border-blue-300 text-blue-600'
                    }
                  >
                    {alert.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-violet-100 text-violet-600 rounded-lg">
                <Activity className="h-3.5 w-3.5" />
              </div>
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round(predictions.overallHealth.score * 100)}%
              </div>
              <p className="text-xs text-slate-500">
                {predictions.overallHealth.assetCount} assets tracked
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {predictions.overallHealth.status === 'excellent' || predictions.overallHealth.status === 'good' ? (
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                )}
                {predictions.overallHealth.status.charAt(0).toUpperCase() + predictions.overallHealth.status.slice(1)} condition
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <DollarSign className="h-3.5 w-3.5" />
              </div>
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                ${predictions.overallHealth.totalValue.toLocaleString()}
              </div>
              <p className="text-xs text-slate-500">
                {predictions.overallHealth.depreciationRate.toFixed(1)}% annual depreciation
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {predictions.overallHealth.depreciationRate > 10 ? (
                  <TrendingDown className="h-3 w-3 text-rose-500" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                )}
                {predictions.overallHealth.depreciationRate > 10 ? 'High depreciation' : 'Stable value'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                <Wrench className="h-3.5 w-3.5" />
              </div>
              Maintenance Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {predictions.maintenancePredictions.assetsNeedingMaintenance}
              </div>
              <p className="text-xs text-slate-500">
                Est. cost: ${predictions.maintenancePredictions.estimatedCost.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar className="h-3 w-3" />
                Next month: ${predictions.maintenancePredictions.predictedNextMonthCost.toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Package className="h-3.5 w-3.5" />
              </div>
              Utilization Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round(predictions.utilizationAnalysis.utilizationRate * 100)}%
              </div>
              <p className="text-xs text-slate-500">
                {predictions.utilizationAnalysis.underutilizedAssets.length} underutilized
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {predictions.utilizationAnalysis.utilizationRate > 0.8 ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-amber-500" />
                )}
                {predictions.utilizationAnalysis.utilizationRate > 0.8 ? 'Optimal' : 'Needs attention'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-rose-100 to-orange-100 text-rose-600 rounded-lg">
                <Wrench className="h-4 w-4" />
              </div>
              Urgent Repairs Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.maintenancePredictions.urgentRepairs.length > 0 ? (
              <div className="space-y-3">
                {predictions.maintenancePredictions.urgentRepairs.slice(0, 5).map((repair, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getUrgencyColor(repair.urgency)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{repair.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {repair.assetCode}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{repair.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold">
                        ${repair.estimatedCost.toLocaleString()}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          repair.urgency === 'high'
                            ? 'border-rose-300 text-rose-600'
                            : repair.urgency === 'medium'
                            ? 'border-amber-300 text-amber-600'
                            : 'border-blue-300 text-blue-600'
                        }
                      >
                        {repair.urgency}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">No urgent repairs needed</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              High Priority Replacements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.replacementNeeds.highPriority.length > 0 ? (
              <div className="space-y-3">
                {predictions.replacementNeeds.highPriority.slice(0, 5).map((item, index) => (
                  <div key={index} className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {item.assetCode}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600">{item.reason}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-semibold">
                        ${item.estimatedCost.toLocaleString()}
                      </span>
                      <Badge variant="outline" className="text-xs text-amber-700">
                        High Priority
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">No high priority replacements needed</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 rounded-lg">
                <Package className="h-4 w-4" />
              </div>
              Underutilized Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.utilizationAnalysis.underutilizedAssets.length > 0 ? (
              <div className="space-y-3">
                {predictions.utilizationAnalysis.underutilizedAssets.slice(0, 5).map((asset, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{asset.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {asset.assetCode}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-xs text-slate-600">
                        {asset.category}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>• Last used: {asset.lastUsed}</p>
                      <p className="text-blue-600">• {asset.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-sm">All assets are well utilized</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600 rounded-lg">
                <BarChart3 className="h-4 w-4" />
              </div>
              Financial Projections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Next Quarter Maintenance</p>
                  <p className="text-lg font-bold text-slate-900">
                    ${predictions.financialProjections.nextQuarterMaintenanceCost.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">Annual Depreciation</p>
                  <p className="text-lg font-bold text-slate-900">
                    ${predictions.financialProjections.nextYearDepreciation.toLocaleString()}
                  </p>
                </div>
              </div>
              {predictions.financialProjections.budgetRecommendations.slice(0, 3).map((rec, index) => (
                <div key={index} className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{rec.category}</span>
                    <span className="text-sm font-bold text-emerald-700">
                      ${rec.recommendedAmount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{rec.reason}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-lg">
              <BarChart3 className="h-4 w-4" />
            </div>
            Category Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictions.categoryInsights.slice(0, 4).map((category, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{category.category}</span>
                    <Badge variant="outline">{category.assetCount} assets</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">
                      ${category.totalValue.toLocaleString()}
                    </span>
                    <Badge
                      variant="outline"
                      className={
                        category.maintenanceTrend === 'increasing'
                          ? 'border-rose-300 text-rose-600'
                          : category.maintenanceTrend === 'stable'
                          ? 'border-emerald-300 text-emerald-600'
                          : 'border-blue-300 text-blue-600'
                      }
                    >
                      {category.maintenanceTrend}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-slate-500 space-y-1">
                  <p>• Average age: {category.averageAge.toFixed(1)} years</p>
                  {category.recommendations.slice(0, 2).map((rec, idx) => (
                    <p key={idx} className="text-blue-600">• {rec}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-600 rounded-lg">
              <Brain className="h-4 w-4" />
            </div>
            AI Insights & Priorities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-2">Key Highlights</h4>
              <div className="space-y-1">
                {predictions.insights.keyHighlights.map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Opportunities</h4>
              <div className="space-y-1">
                {predictions.insights.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                    <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Prioritized Actions</h4>
              <div className="space-y-2">
                {predictions.insights.priorities.slice(0, 5).map((priority, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      priority.urgency === 'high'
                        ? 'bg-rose-50 border-rose-200'
                        : priority.urgency === 'medium'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-medium">{priority.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            priority.urgency === 'high'
                              ? 'border-rose-300 text-rose-600'
                              : priority.urgency === 'medium'
                              ? 'border-amber-300 text-amber-600'
                              : 'border-blue-300 text-blue-600'
                          }`}
                        >
                          {priority.urgency}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            priority.impact === 'high'
                              ? 'border-emerald-300 text-emerald-600'
                              : priority.impact === 'medium'
                              ? 'border-blue-300 text-blue-600'
                              : 'border-slate-300 text-slate-600'
                          }`}
                        >
                          {priority.impact} impact
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
