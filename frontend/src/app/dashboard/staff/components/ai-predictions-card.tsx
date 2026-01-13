'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, Briefcase, Loader2, RefreshCw, DollarSign, Calendar } from 'lucide-react'
import { StaffPrediction } from '@/lib/ai/types/staff-prediction'

interface AIPredictionsCardProps {
  sectionId?: string
}

const fetchStaffPredictions = async () => {
  const response = await fetch('/api/staff/predictions')
  if (!response.ok) {
    throw new Error('Failed to load predictions')
  }
  return response.json()
}

export default function AIPredictionsCard({ sectionId }: AIPredictionsCardProps) {
  const { data: predictions, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['staff-predictions'],
    queryFn: fetchStaffPredictions,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  const handleRefresh = () => {
    refetch()
  }

  if (isLoading) {
    return (
      <Card className="border-l-4 border-l-neutral-900 border-neutral-200/60 shadow-none">
        <CardHeader className="pb-4 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <Brain className="h-4 w-4 text-neutral-500" />
            Staff Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-amber-600 border-neutral-200/60 shadow-none">
        <CardHeader className="pb-4 pt-5 px-5">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Analytics Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-sm text-neutral-600 mb-3">{error}</p>
          <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8">
            <RefreshCw className="h-3.5 w-3.5 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!predictions) return null

  return (
    <Card className="border-l-4 border-l-neutral-900 border-neutral-200/60 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-5">
        <div>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-neutral-900">
            <Brain className="h-4 w-4 text-neutral-500" />
            Staff Analytics
          </CardTitle>
          <p className="text-xs text-neutral-500 mt-0.5">Data-driven insights from your staff records</p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={isFetching}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="p-3 bg-neutral-50/50 rounded-lg border border-neutral-200/60">
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-neutral-500" />
                <span className="text-xs text-neutral-600 font-medium">Total Staff</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">{predictions.staffSummary.total}</div>
            </div>
            <div className="p-3 bg-neutral-50/50 rounded-lg border border-neutral-200/60">
              <div className="flex items-center gap-1.5 mb-1">
                <Briefcase className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs text-neutral-600 font-medium">Teachers</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">{predictions.staffSummary.teachers}</div>
            </div>
            <div className="p-3 bg-neutral-50/50 rounded-lg border border-neutral-200/60">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-neutral-600 font-medium">Active</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">{predictions.staffSummary.activeRate}%</div>
            </div>
            <div className="p-3 bg-neutral-50/50 rounded-lg border border-neutral-200/60">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="h-3.5 w-3.5 text-purple-500" />
                <span className="text-xs text-neutral-600 font-medium">Avg Tenure</span>
              </div>
              <div className="text-2xl font-bold text-neutral-900">{predictions.tenureAnalysis.averageTenure}y</div>
            </div>
          </div>

          {predictions.staffSummary.activeRate < 85 && (
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/60">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Low Active Rate</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {predictions.staffSummary.activeRate}% of staff are active. {predictions.staffSummary.onLeaveCount} on leave.
                  </p>
                </div>
              </div>
            </div>
          )}

          {predictions.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Recommendations</p>
              {predictions.recommendations.slice(0, 3).map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    rec.type === 'warning'
                      ? 'bg-amber-50/80 border-amber-200/60'
                      : rec.type === 'success'
                      ? 'bg-emerald-50/80 border-emerald-200/60'
                      : 'bg-neutral-50/80 border-neutral-200/60'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {rec.type === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{rec.title}</p>
                      <p className="text-xs text-neutral-600 mt-0.5">{rec.message}</p>
                    </div>
                    {rec.priority === 'high' && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                        High
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {predictions.retentionRisk.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Retention Risk</p>
              {predictions.retentionRisk.slice(0, 2).map((risk, index) => (
                <div key={index} className="p-3 bg-red-50/80 rounded-lg border border-red-200/60">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-neutral-900">{risk.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        risk.riskFactor === 'high'
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : risk.riskFactor === 'medium'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                      }`}
                    >
                      {risk.riskFactor}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-600">{risk.reason}</p>
                </div>
              ))}
            </div>
          )}

          {predictions.departmentBalance.some(d => d.workloadLevel === 'overloaded') && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Department Balance</p>
              {predictions.departmentBalance
                .filter(d => d.workloadLevel !== 'balanced')
                .slice(0, 2)
                .map((dept, index) => (
                  <div key={index} className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-900">{dept.name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${
                          dept.workloadLevel === 'overloaded'
                            ? 'bg-red-100 text-red-700 border-red-200'
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        {dept.percentage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-600">
                      {dept.count} staff ({dept.workloadLevel} workload)
                    </p>
                  </div>
                ))}
            </div>
          )}

          {predictions.salaryAnalysis.salaryByDepartment.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Salary Overview</p>
              <div className="grid gap-2 grid-cols-2">
                <div className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-neutral-500" />
                    <span className="text-xs text-neutral-600 font-medium">Average</span>
                  </div>
                  <div className="text-lg font-bold text-neutral-900">
                    {predictions.salaryAnalysis.averageSalary.toLocaleString()} BDT
                  </div>
                </div>
                <div className="p-3 bg-neutral-50/80 rounded-lg border border-neutral-200/60">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="h-3.5 w-3.5 text-neutral-500" />
                    <span className="text-xs text-neutral-600 font-medium">Range</span>
                  </div>
                  <div className="text-sm font-semibold text-neutral-900">
                    {predictions.salaryAnalysis.salaryRange.min.toLocaleString()} - {predictions.salaryAnalysis.salaryRange.max.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
