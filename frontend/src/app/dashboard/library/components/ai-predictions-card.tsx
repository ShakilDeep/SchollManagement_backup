import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, BookOpen, AlertTriangle, TrendingUp, Clock, BarChart3, CheckCircle, Lightbulb, Package, ArrowUpRight } from 'lucide-react'
import { LibraryPrediction } from '@/lib/ai/types'

interface LibraryPredictionsCardProps {
  predictions: LibraryPrediction | null
  isLoading?: boolean
}

export default function LibraryPredictionsCard({ predictions, isLoading }: LibraryPredictionsCardProps) {
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-emerald-600 bg-emerald-50'
      case 'good':
        return 'text-blue-600 bg-blue-50'
      case 'fair':
        return 'text-amber-600 bg-amber-50'
      case 'poor':
        return 'text-rose-600 bg-rose-50'
      default:
        return 'text-slate-600 bg-slate-50'
    }
  }

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4" />
      case 'good':
        return <CheckCircle className="h-4 w-4" />
      case 'fair':
        return <Lightbulb className="h-4 w-4" />
      case 'poor':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-violet-500" />
            AI-Powered Library Insights
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
          <p className="text-sm text-slate-400 mt-2">Insufficient library data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-violet-100 to-fuchsia-100 text-violet-600 rounded-lg">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI-Powered Library Insights</h2>
            <p className="text-sm text-slate-500">
              Generated at {new Date(predictions.generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-violet-50 text-violet-700">
          Library Dashboard
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                <BarChart3 className="h-3.5 w-3.5" />
              </div>
              Overall Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {Math.round(predictions.overallHealth.score * 100)}%
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(predictions.overallHealth.status)}`}>
                {getHealthIcon(predictions.overallHealth.status)}
                {predictions.overallHealth.status}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              Book Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {predictions.borrowingPatterns.frequentBorrowers.length}
              </div>
              <p className="text-xs text-slate-500">
                Frequent borrowers this month
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <TrendingUp className="h-3 w-3" />
                {predictions.borrowingPatterns.overdueTrend}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg">
                <Clock className="h-3.5 w-3.5" />
              </div>
              Avg Loan Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {predictions.borrowingPatterns.averageLoanDuration}
              </div>
              <p className="text-xs text-slate-500">
                Days on average
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <ArrowUpRight className="h-3 w-3" />
                Peak: {predictions.borrowingPatterns.peakBorrowingTimes[0]?.day || 'N/A'}
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
                <AlertTriangle className="h-4 w-4" />
              </div>
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {predictions.stockAlerts.outOfStockBooks.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                All books are in stock
              </div>
            ) : (
              <div className="space-y-2">
                {predictions.stockAlerts.outOfStockBooks.slice(0, 5).map((book, index) => (
                  <div key={index} className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-rose-900">{book.title}</p>
                        <p className="text-xs text-rose-700 mt-1">{book.author}</p>
                      </div>
                      <Badge variant="outline" className="border-rose-300 text-rose-600">
                        Out of Stock
                      </Badge>
                    </div>
                    <p className="text-xs text-rose-600 mt-2">
                      {book.recommendation}
                    </p>
                  </div>
                ))}
                {predictions.stockAlerts.outOfStockBooks.length > 5 && (
                  <p className="text-xs text-slate-500 text-center">
                    +{predictions.stockAlerts.outOfStockBooks.length - 5} more
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-600 rounded-lg">
                <TrendingUp className="h-4 w-4" />
              </div>
              Popular Books
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predictions.popularBooks.trendingBooks.slice(0, 5).map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-900">{book.title}</p>
                    <p className="text-xs text-emerald-700 mt-1">{book.author}</p>
                  </div>
                  <Badge variant="outline" className="border-emerald-300 text-emerald-600">
                    {book.borrowCount} borrows
                  </Badge>
                </div>
              ))}
              {predictions.popularBooks.trendingBooks.length === 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <BookOpen className="h-4 w-4" />
                  No trending books yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-600 rounded-lg">
                <Clock className="h-4 w-4" />
              </div>
              Borrowing Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Peak Borrowing Times</h4>
                <div className="space-y-2">
                  {predictions.borrowingPatterns.peakBorrowingTimes.slice(0, 3).map((time, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{time.day}</span>
                      <Badge variant="outline">{time.time}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="space-y-1 text-sm text-slate-600">
                  <p>• Overdue rate: {Math.round(predictions.borrowingPatterns.overdueRate || 0)}%</p>
                  <p>• Return delay: {predictions.borrowingPatterns.averageReturnDelay || 0} days</p>
                  <p>• Frequency: {predictions.borrowingPatterns.borrowingFrequency}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-600 rounded-lg">
                <Package className="h-4 w-4" />
              </div>
              Category Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictions.categoryPerformance.topPerforming.slice(0, 4).map((category, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.category}</span>
                    <Badge variant="outline">{Math.round(category.borrowRate)}% rate</Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(category.borrowRate, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{category.totalBooks} books</span>
                    <span>{Math.round(category.borrowRate)}% borrow rate</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {predictions.acquisitionRecommendations.recommendedPurchases.length > 0 && (
        <Card className="border-none shadow-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-600 rounded-lg">
                <Lightbulb className="h-4 w-4" />
              </div>
              Acquisition Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predictions.acquisitionRecommendations.recommendedPurchases.slice(0, 5).map((book, index) => (
                <div key={index} className="flex items-start justify-between gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">{book.title}</p>
                    <p className="text-xs text-amber-700 mt-1">{book.author}</p>
                    <p className="text-xs text-amber-600 mt-1">
                      Category: {book.category} • Priority: {book.priority}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-300 text-amber-600 whitespace-nowrap">
                    ${book.estimatedCost}
                  </Badge>
                </div>
              ))}
              {predictions.acquisitionRecommendations.recommendedPurchases.length > 5 && (
                <p className="text-xs text-slate-500 text-center">
                  +{predictions.acquisitionRecommendations.recommendedPurchases.length - 5} more recommendations
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
