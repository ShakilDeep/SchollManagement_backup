'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BedDouble, 
  AlertTriangle, 
  Info, 
  Users, 
  CheckCircle2, 
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'
import type { HostelPrediction } from '@/lib/ai/types'

interface AIPredictionsCardProps {
  predictions: HostelPrediction | null
  isLoading: boolean
  error?: string | null
}

export default function AIPredictionsCard({ predictions, isLoading, error }: AIPredictionsCardProps) {
  if (isLoading) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Hostel AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-md border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-600" />
            Hostel AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!predictions) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-800'
      case 'good':
        return 'bg-blue-100 text-blue-800'
      case 'fair':
        return 'bg-yellow-100 text-yellow-800'
      case 'poor':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'decreasing':
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
      default:
        return <Info className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Hostel AI Insights</h2>
        <Badge variant="outline" className="text-xs">
          Updated {new Date(predictions.generatedAt).toLocaleDateString()}
        </Badge>
      </div>

      {predictions.alerts.length > 0 && (
        <Card className="border-none shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-3">
              {predictions.alerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Overall Health</span>
              <Badge className={getStatusColor(predictions.overallHealth.status)}>
                {predictions.overallHealth.status}
              </Badge>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {predictions.overallHealth.score}%
            </div>
            <p className="text-xs text-gray-500 mt-1">{predictions.overallHealth.summary}</p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Occupancy Rate</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(predictions.occupancyForecast.trend)}
                <Badge variant="outline" className="text-xs">
                  {predictions.occupancyForecast.trend}
                </Badge>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {predictions.occupancyForecast.current}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Projected: {predictions.occupancyForecast.projected}%
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Revenue Collection</span>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {predictions.feeCollection.collectionRate}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pending: ${predictions.feeCollection.pendingAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Popular Hostels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.popularHostels.slice(0, 5).map((hostel) => (
                <div key={hostel.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{hostel.name}</p>
                    <p className="text-xs text-gray-500">{hostel.totalStudents} students</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${hostel.occupancyRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{hostel.occupancyRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BedDouble className="h-5 w-5 text-purple-600" />
              Room Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.roomUtilization.mostUtilized.slice(0, 5).map((room, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{room.roomNumber}</p>
                    <p className="text-xs text-gray-500">{room.hostelName} • {room.capacity} capacity</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${room.utilizationRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold">{room.utilizationRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Gender Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                  <span className="text-sm">Male</span>
                </div>
                <span className="font-semibold">{predictions.genderDistribution.maleCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-600"></div>
                  <span className="text-sm">Female</span>
                </div>
                <span className="font-semibold">{predictions.genderDistribution.femaleCount}</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Badge 
                    className={predictions.genderDistribution.balance === 'balanced' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {predictions.genderDistribution.balance}
                  </Badge>
                  <span className="text-xs text-gray-600">{predictions.genderDistribution.summary}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Capacity Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.capacityAlerts.map((alert, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  {alert.type === 'critical' && <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />}
                  {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                  {alert.type === 'info' && <Info className="h-4 w-4 text-blue-600 mt-0.5" />}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-gray-600">{alert.description}</p>
                  </div>
                  <Badge className={alert.type === 'critical' 
                    ? 'bg-red-100 text-red-800' 
                    : alert.type === 'warning' 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : 'bg-blue-100 text-blue-800'
                  }>
                    {alert.type}
                  </Badge>
                </div>
              ))}
              {predictions.capacityAlerts.length === 0 && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="text-sm">No capacity alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Actionable Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Key Highlights</h4>
              <ul className="space-y-2">
                {predictions.insights.keyHighlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2">Priorities</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {predictions.insights.priorities.map((priority, index) => (
                  <div key={index} className="p-3 rounded-lg border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{priority.title}</span>
                      <Badge className={priority.impact === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : priority.impact === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-blue-100 text-blue-800'
                      }>
                        {priority.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{priority.description}</p>
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
