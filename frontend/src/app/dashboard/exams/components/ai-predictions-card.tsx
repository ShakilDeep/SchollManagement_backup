import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, AlertTriangle, TrendingUp, TrendingDown, Target, CheckCircle, XCircle, Lightbulb, Bell, BookOpen, Calendar, BarChart3, Award, Users, AlertCircle, ChevronRight, ChevronDown, Activity, Eye, Zap } from 'lucide-react'

interface StudentRiskFactor {
  studentId: string
  studentName: string
  rollNumber: string
  grade: string
  section: string
  riskLevel: 'high' | 'medium' | 'low'
  currentAverage: number
  trend: 'improving' | 'stable' | 'declining'
  confidence: number
  totalExams: number
  passRate: number
  recommendedActions: string[]
}

interface SubjectAnalysis {
  subject: string
  averageScore: number
  passRate: number
  difficulty: 'easy' | 'medium' | 'hard'
  totalExams: number
  strugglingGrades: string[]
  topPerformers: string[]
}

interface GradeComparison {
  grade: string
  section: string
  averageScore: number
  totalStudents: number
  weakestSubject: string
  strongestSubject: string
}

interface OverallStats {
  totalStudents: number
  totalExamResults: number
  overallAverage: number
  highRiskStudents: number
  mediumRiskStudents: number
  lowRiskStudents: number
  improvingStudents: number
  decliningStudents: number
  stableStudents: number
}

interface Alert {
  type: 'warning' | 'info' | 'success' | 'urgent'
  priority: 'high' | 'medium' | 'low'
  message: string
  actionable: boolean
}

interface ExamPrediction {
  studentRiskFactors: StudentRiskFactor[]
  subjectAnalysis: SubjectAnalysis[]
  gradeComparison: GradeComparison[]
  overallStats: OverallStats
  alerts: Alert[]
  generatedAt: Date
}

interface AIPredictionsCardProps {
  predictions: ExamPrediction | null
  isLoading?: boolean
}

export default function AIPredictionsCard({ predictions, isLoading }: AIPredictionsCardProps) {
  if (isLoading) {
    return (
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            AI-Powered Exam Insights
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
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Unable to load AI predictions</p>
          <p className="text-sm text-slate-400 mt-2">Insufficient exam data available</p>
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
      case 'urgent':
        return <AlertCircle className="h-4 w-4" />
      case 'info':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800'
      case 'success':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800'
      case 'urgent':
        return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950/50 dark:border-rose-800'
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800'
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-950/50 dark:border-slate-800'
    }
  }

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800'
    }
  }

  const getDifficultyBadgeColor = (level: string) => {
    switch (level) {
      case 'hard':
        return 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800'
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800'
      case 'easy':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-950/50 dark:text-slate-400 dark:border-slate-800'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-emerald-500" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-rose-500" />
      default:
        return <Activity className="h-4 w-4 text-slate-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600 dark:from-blue-950/50 dark:to-indigo-950/50 dark:text-blue-400 rounded-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI-Powered Exam Insights</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Generated at {new Date(predictions.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800">
          {predictions.overallStats.totalStudents} students analyzed
        </Badge>
      </div>

      {predictions.alerts.length > 0 && (
        <Card className="border-none shadow-md bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900 dark:text-white">
              <Bell className="h-4 w-4 text-blue-600" />
              Key Alerts & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.alerts.map((alert, idx) => (
                <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                  {getAlertIcon(alert.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                  </div>
                  {alert.actionable && (
                    <Badge variant="outline" className="text-xs">
                      Action Required
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm font-medium">High Risk</p>
                <p className="text-3xl font-bold mt-1">{predictions.overallStats.highRiskStudents}</p>
                <p className="text-rose-100 text-xs mt-1">Students need help</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Average Score</p>
                <p className="text-3xl font-bold mt-1">{Math.round(predictions.overallStats.overallAverage)}%</p>
                <p className="text-amber-100 text-xs mt-1">Overall performance</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <BarChart3 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Improving</p>
                <p className="text-3xl font-bold mt-1">{predictions.overallStats.improvingStudents}</p>
                <p className="text-emerald-100 text-xs mt-1">Positive trends</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Exam Results</p>
                <p className="text-3xl font-bold mt-1">{predictions.overallStats.totalExamResults}</p>
                <p className="text-blue-100 text-xs mt-1">Total records</p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Award className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-rose-500" />
              Student Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.studentRiskFactors.slice(0, 5).map((student, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">{student.studentName}</p>
                      <Badge className={`text-xs ${getRiskBadgeColor(student.riskLevel)}`}>
                        {student.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {student.grade} - {student.section} • Avg: {Math.round(student.currentAverage)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(student.trend)}
                    <span className="text-xs text-slate-500 dark:text-slate-400">{student.totalExams} exams</span>
                  </div>
                </div>
              ))}
              {predictions.studentRiskFactors.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No risk data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <BookOpen className="h-5 w-5 text-blue-500" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.subjectAnalysis.slice(0, 5).map((subject, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 dark:text-white">{subject.subject}</p>
                      <Badge className={`text-xs ${getDifficultyBadgeColor(subject.difficulty)}`}>
                        {subject.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Pass Rate: {subject.passRate}% • {subject.totalExams} exams
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {Math.round(subject.averageScore)}%
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Average</p>
                  </div>
                </div>
              ))}
              {predictions.subjectAnalysis.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-4">No subject data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
            <Target className="h-5 w-5 text-violet-500" />
            Grade Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Grade</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Students</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Average</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Strongest Subject</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-700 dark:text-slate-300">Weakest Subject</th>
                </tr>
              </thead>
              <tbody>
                {predictions.gradeComparison.slice(0, 5).map((grade, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                          {grade.grade.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{grade.grade}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{grade.section}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{grade.totalStudents}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {Math.round(grade.averageScore)}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/50">
                        {grade.strongestSubject}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-rose-700 border-rose-300 bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:bg-rose-950/50">
                        {grade.weakestSubject}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {predictions.gradeComparison.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-500 dark:text-slate-400 py-8">
                      No grade comparison data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.studentRiskFactors.slice(0, 4).map((student, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <p className="font-medium text-slate-900 dark:text-white">{student.studentName}</p>
                  <Badge className={`text-xs ${getRiskBadgeColor(student.riskLevel)}`}>
                    {student.riskLevel} risk
                  </Badge>
                </div>
                <ul className="space-y-1">
                  {student.recommendedActions.map((action, actionIdx) => (
                    <li key={actionIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0 text-blue-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {predictions.studentRiskFactors.length === 0 && (
              <p className="col-span-2 text-center text-slate-500 dark:text-slate-400 py-4">
                No recommendations available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
