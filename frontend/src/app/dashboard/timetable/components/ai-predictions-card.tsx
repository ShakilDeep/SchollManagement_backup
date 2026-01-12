import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Clock, BookOpen, AlertTriangle, TrendingUp, Users, Target, CheckCircle, XCircle, Lightbulb, Calendar, BarChart3, Bell } from 'lucide-react'

interface TimetablePrediction {
  sectionId: string
  sectionName: string
  optimalSchedule: {
    recommendedChanges: Array<{
      type: 'move' | 'swap' | 'add' | 'remove'
      description: string
      impact: 'high' | 'medium' | 'low'
    }>
    bestDay: string
    bestPeriod: number
    peakPerformanceWindow: string
  }
  teacherEffectiveness: Array<{
    teacherName: string
    averageScore: number
    classCount: number
    topSubjects: string[]
    improvementSuggestions: string[]
  }>
  subjectDistribution: Array<{
    subject: string
    totalPeriods: number
    averageScore: number
    difficulty: string
    recommendedPeriods: string[]
  }>
  conflictAnalysis: {
    hasConflicts: boolean
    conflicts: Array<{
      day: string
      period: number
      description: string
      severity: 'high' | 'medium' | 'low'
      resolution: string
    }>
  }
  studyLoadAnalysis: {
    dailyLoad: Array<{
      day: string
      totalPeriods: number
      averageDifficulty: number
      recommendation: string
    }>
    heavyDays: string[]
    lightDays: string[]
    balanceScore: number
  }
  performanceInsights: {
    correlation: number
    insights: Array<{
      pattern: string
      impact: string
      recommendation: string
    }>
  }
  alerts: Array<{
    type: 'warning' | 'info' | 'success'
    message: string
    priority: 'high' | 'medium' | 'low'
  }>
  generatedAt: Date
}

interface AIPredictionsCardProps {
  predictions: TimetablePrediction | null
  isLoading?: boolean
}

export default function AIPredictionsCard({ predictions, isLoading }: AIPredictionsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            AI-Powered Timetable Insights
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
          <p className="text-sm text-slate-400 mt-2">Insufficient timetable data available</p>
        </CardContent>
      </Card>
    )
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'info':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-amber-600 bg-amber-50'
      case 'success':
        return 'text-emerald-600 bg-emerald-50'
      case 'info':
        return 'text-blue-600 bg-blue-50'
      default:
        return 'text-slate-600 bg-slate-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-600 rounded-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI-Powered Timetable Insights</h2>
            <p className="text-sm text-slate-500">
              Generated at {new Date(predictions.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-violet-50 text-violet-700">
          Section {predictions.sectionName}
        </Badge>
      </div>

      {/* Alerts Section */}
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
                  className={`flex items-start gap-3 p-3 rounded-lg ${getAlertColor(alert.type)}`}
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Calendar className="h-3.5 w-3.5" />
              </div>
              Schedule Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round(predictions.optimalSchedule.overallOptimizationScore * 100)}%
              </div>
              <p className="text-xs text-slate-500">
                {predictions.optimalSchedule.improvementPotential}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <CheckCircle className="h-3 w-3" />
                {predictions.studyLoadAnalysis.weeklyBalance === 'balanced' ? 'Well balanced' : 'Needs adjustment'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <Users className="h-3.5 w-3.5" />
              </div>
              Teacher Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {predictions.teacherEffectiveness.length > 0
                  ? Math.round(
                      predictions.teacherEffectiveness.reduce((sum, t) => sum + t.effectivenessScore, 0) /
                        predictions.teacherEffectiveness.length
                    )
                  : 0}
                /100
              </div>
              <p className="text-xs text-slate-500">
                {predictions.teacherEffectiveness.length} active teachers
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp className="h-3 w-3" />
                {predictions.teacherEffectiveness.length > 0 &&
                predictions.teacherEffectiveness[0].effectivenessScore > 70
                  ? 'Above average'
                  : 'Room for improvement'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                <BarChart3 className="h-3.5 w-3.5" />
              </div>
              Conflict Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {predictions.conflictAnalysis.detectedConflicts.length > 0 ? (
                  <span className="text-rose-600">
                    {predictions.conflictAnalysis.detectedConflicts.length}
                  </span>
                ) : (
                  <span className="text-emerald-600">0</span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {predictions.conflictAnalysis.detectedConflicts.length > 0
                  ? 'Conflicts detected'
                  : 'No conflicts'}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                {predictions.conflictAnalysis.detectedConflicts.length > 0 ? (
                  <XCircle className="h-3 w-3 text-rose-500" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                )}
                {predictions.conflictAnalysis.detectedConflicts.length > 0 ? 'Review needed' : 'All clear'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Load Analysis */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 rounded-lg">
                <BarChart3 className="h-4 w-4" />
              </div>
              Study Load Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Daily Breakdown</h4>
                <div className="space-y-2">
                  {predictions.studyLoadAnalysis.dailyLoad.map((day) => (
                    <div key={day.day} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{day.day}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{day.totalPeriods} periods</Badge>
                        <Badge
                          variant="outline"
                          className={
                            day.averageDifficulty > 0.7
                              ? 'border-rose-300 text-rose-600'
                              : day.averageDifficulty > 0.4
                              ? 'border-amber-300 text-amber-600'
                              : 'border-emerald-300 text-emerald-600'
                          }
                        >
                          {Math.round(day.averageDifficulty * 100)}% difficulty
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t">
                <h4 className="text-sm font-semibold mb-2">Recommendations</h4>
                <div className="space-y-1 text-sm text-slate-600">
                  {predictions.studyLoadAnalysis.peakDays.length > 0 && (
                    <p>• Peak days: {predictions.studyLoadAnalysis.peakDays.join(', ')}</p>
                  )}
                  {predictions.studyLoadAnalysis.lightDays.length > 0 && (
                    <p>• Light days: {predictions.studyLoadAnalysis.lightDays.join(', ')}</p>
                  )}
                  <p>• Balance: {predictions.studyLoadAnalysis.weeklyBalance}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optimal Schedule */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600 rounded-lg">
                <Target className="h-4 w-4" />
              </div>
              Schedule Optimization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Suggested Changes</h4>
                <div className="space-y-2">
                  {predictions.optimalSchedule.suggestedChanges.map((change, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        change.impact === 'high'
                          ? 'bg-rose-50 border-rose-200'
                          : change.impact === 'medium'
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Badge
                            variant="outline"
                            className={
                              change.impact === 'high'
                                ? 'border-rose-300 text-rose-600'
                                : change.impact === 'medium'
                                ? 'border-amber-300 text-amber-600'
                                : 'border-blue-300 text-blue-600'
                            }
                          >
                            {change.impact} impact
                          </Badge>
                          <p className="text-sm font-medium">{change.currentSubject} → {change.suggestedSubject}</p>
                        </div>
                        <p className="text-xs text-slate-600">{change.reason}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">Confidence:</span>
                          <div className="flex-1 bg-slate-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-emerald-500"
                              style={{ width: `${Math.round(change.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-slate-600">{Math.round(change.confidence * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teacher Effectiveness */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              Teacher Effectiveness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.teacherEffectiveness.slice(0, 3).map((teacher, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                          index === 0
                            ? 'bg-emerald-500'
                            : index === 1
                            ? 'bg-blue-500'
                            : 'bg-purple-500'
                        }`}
                      >
                        {teacher.teacherName.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <span className="font-medium">{teacher.teacherName}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        teacher.effectivenessScore > 80
                          ? 'border-emerald-300 text-emerald-600'
                          : teacher.effectivenessScore > 60
                          ? 'border-blue-300 text-blue-600'
                          : 'border-amber-300 text-amber-600'
                      }
                    >
                      {Math.round(teacher.effectivenessScore)}%
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• {teacher.periodsAssigned} periods per week</p>
                    <p>• Primary subject: {teacher.subject}</p>
                    {teacher.recommendations.length > 0 && (
                      <p className="text-amber-600">• {teacher.recommendations[0]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-600 rounded-lg">
                <BookOpen className="h-4 w-4" />
              </div>
              Subject Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.subjectDistribution.slice(0, 4).map((subject, index) => (
                <div key={index} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{subject.subject}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{subject.periodsPerWeek} periods</Badge>
                      <Badge
                        variant="outline"
                        className={
                          subject.balanceScore > 80
                            ? 'border-emerald-300 text-emerald-600'
                            : subject.balanceScore > 60
                            ? 'border-blue-300 text-blue-600'
                            : 'border-amber-300 text-amber-600'
                        }
                      >
                        {Math.round(subject.balanceScore)}% balanced
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 space-y-1">
                    <p>• Distribution: {subject.difficultyDistribution}</p>
                    <p>• Ideal periods: {subject.idealPeriods}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      {predictions.performanceInsights.subjectPerformanceCorrelation.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.performanceInsights.subjectPerformanceCorrelation.map((insight, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-lg border border-violet-100"
                >
                  <h4 className="font-semibold text-sm mb-2 text-violet-900">{insight.subject}</h4>
                  <p className="text-sm text-violet-700 mb-2">Avg: {Math.round(insight.avgPerformance)}% | Best: {insight.bestDay} | Worst: {insight.worstDay}</p>
                  <p className="text-xs text-violet-600">{insight.insight}</p>
                </div>
              ))}
            </div>
            {predictions.performanceInsights.recommendations.length > 0 && (
              <div className="mt-4 p-3 bg-violet-100 rounded-lg">
                <p className="text-xs font-medium text-violet-900">Key Recommendation:</p>
                <p className="text-xs text-violet-700">{predictions.performanceInsights.recommendations[0]}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conflict Analysis */}
      {predictions.conflictAnalysis.detectedConflicts.length > 0 && (
        <Card className="border-none shadow-md border-l-4 border-l-rose-500">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-rose-100 to-red-100 text-rose-600 rounded-lg">
                <AlertTriangle className="h-4 w-4" />
              </div>
              Conflict Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.conflictAnalysis.detectedConflicts.map((conflict, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    conflict.severity === 'high'
                      ? 'bg-rose-50 border-rose-200'
                      : conflict.severity === 'medium'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          conflict.severity === 'high'
                            ? 'border-rose-300 text-rose-600'
                            : conflict.severity === 'medium'
                            ? 'border-amber-300 text-amber-600'
                            : 'border-blue-300 text-blue-600'
                        }
                      >
                        {conflict.severity}
                      </Badge>
                      <span className="font-medium">
                        {conflict.affectedSlots.map((slot, i) => (
                          <span key={i}>
                            {slot.day} - Period {slot.period}{i < conflict.affectedSlots.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm mb-2">{conflict.description}</p>
                  <p className="text-xs font-semibold text-slate-600">
                    Resolution: {conflict.resolution}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
