import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { LibraryPredictionService } from '@/lib/ai/services/library-predictions'
import { LibraryPrediction } from '@/lib/ai/types'

function generateFallbackPredictions(books: any[], borrowals: any[]): LibraryPrediction {
  const totalBooks = books.length
  const totalCopies = books.reduce((sum, b) => sum + b.totalCopies, 0)
  const availableCopies = books.reduce((sum, b) => sum + b.availableCopies, 0)
  const borrowedCopies = totalCopies - availableCopies
  const overdueCount = borrowals.filter(b => b.status === 'Overdue').length

  const healthScore = availableCopies / totalCopies
  let healthStatus: 'excellent' | 'good' | 'fair' | 'poor' = 'good'
  if (healthScore > 0.8) healthStatus = 'excellent'
  else if (healthScore > 0.6) healthStatus = 'good'
  else if (healthScore > 0.4) healthStatus = 'fair'
  else healthStatus = 'poor'

  const categoryStats: Record<string, any> = {}
  books.forEach(book => {
    if (!categoryStats[book.category]) {
      categoryStats[book.category] = { totalBooks: 0, borrowCount: 0 }
    }
    categoryStats[book.category].totalBooks++
  })

  borrowals.forEach(borrowal => {
    const book = books.find(b => b.id === borrowal.bookId)
    if (book && categoryStats[book.category]) {
      categoryStats[book.category].borrowCount++
    }
  })

  const topCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1].borrowCount - a[1].borrowCount)
    .slice(0, 5)
    .map(([category, stats]) => ({
      category,
      totalBooks: stats.totalBooks,
      borrowRate: stats.totalBooks > 0 ? (stats.borrowCount / stats.totalBooks) * 100 : 0,
      averageRating: 4.0,
      recommendations: [`Maintain current ${category} collection`, `Monitor ${category} borrowing trends`]
    }))

  const outOfStockBooks = books
    .filter(b => b.availableCopies === 0)
    .slice(0, 5)
    .map(book => ({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      totalCopies: book.totalCopies,
      recommendation: `Reorder immediately - high demand`,
      urgency: 'high' as const
    }))

  const lowStockBooks = books
    .filter(b => b.availableCopies > 0 && b.availableCopies < 2)
    .slice(0, 5)
    .map(book => ({
      isbn: book.isbn,
      title: book.title,
      author: book.author,
      category: book.category,
      availableCopies: book.availableCopies,
      recommendedReorder: 3
    }))

  const alerts: LibraryPrediction['alerts'] = []
  if (outOfStockBooks.length > 0) {
    alerts.push({
      type: 'urgent',
      title: `${outOfStockBooks.length} books out of stock`,
      message: 'Immediate restocking required',
      action: 'Review out-of-stock items',
      priority: 'high'
    })
  }
  if (lowStockBooks.length > 0) {
    alerts.push({
      type: 'warning',
      title: `${lowStockBooks.length} books low on stock`,
      message: 'Consider reordering soon',
      action: 'Check low-stock inventory',
      priority: 'medium'
    })
  }
  if (overdueCount > 0) {
    alerts.push({
      type: 'warning',
      title: `${overdueCount} overdue borrowals`,
      message: 'Follow up with students',
      action: 'Send reminder notifications',
      priority: 'medium'
    })
  }

  return {
    overallHealth: {
      score: healthScore,
      status: healthStatus,
      totalBooks,
      totalCopies,
      collectionValue: totalCopies * 25,
      averageBookAge: 3
    },
    popularBooks: {
      trendingBooks: books.slice(0, 5).map(book => ({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        category: book.category,
        borrowCount: borrowals.filter(b => b.bookId === book.id).length,
        availableCopies: book.availableCopies,
        recommendation: 'High demand title'
      })),
      highDemandCategories: topCategories.map(cat => ({
        category: cat.category,
        borrowCount: categoryStats[cat.category].borrowCount,
        totalBooks: cat.totalBooks,
        demandTrend: 'stable' as const
      })),
      seasonalityInsights: ['Steady borrowing patterns observed', 'Peak usage during exam periods']
    },
    stockAlerts: {
      outOfStockBooks,
      lowStockBooks,
      needRestocking: outOfStockBooks.length > 0,
      estimatedRestockCost: (outOfStockBooks.length + lowStockBooks.length) * 25
    },
    borrowingPatterns: {
      averageLoanDuration: 7,
      peakBorrowingTimes: [
        { day: 'Monday', time: '10:00 AM', borrowCount: Math.floor(borrowals.length * 0.2) },
        { day: 'Wednesday', time: '2:00 PM', borrowCount: Math.floor(borrowals.length * 0.15) }
      ],
      overdueTrend: overdueCount > 0 ? 'increasing' : 'stable',
      averageReturnDelay: 2,
      frequentBorrowers: borrowals
        .reduce((acc: any[], b) => {
          const existing = acc.find(x => x.studentId === b.studentId)
          if (existing) {
            existing.borrowCount++
            if (b.status === 'Overdue') existing.overdueCount++
          } else {
            acc.push({
              studentId: b.studentId,
              studentName: borrowals.find(x => x.studentId === b.studentId)?.student?.firstName + ' ' + borrowals.find(x => x.studentId === b.studentId)?.student?.lastName || 'Unknown',
              rollNumber: borrowals.find(x => x.studentId === b.studentId)?.student?.rollNumber || 'Unknown',
              borrowCount: 1,
              overdueCount: b.status === 'Overdue' ? 1 : 0
            })
          }
          return acc
        }, [])
        .sort((a, b) => b.borrowCount - a.borrowCount)
        .slice(0, 5),
      borrowingFrequency: borrowals.length > 0 ? 'moderate' : 'low'
    },
    acquisitionRecommendations: {
      recommendedPurchases: [
        {
          title: 'Introduction to Advanced Mathematics',
          author: 'Various Authors',
          category: 'Mathematics',
          estimatedCost: 35,
          reason: 'High demand in STEM curriculum',
          priority: 'high'
        },
        {
          title: 'Modern Physics Explained',
          author: 'Dr. Science',
          category: 'Science',
          estimatedCost: 40,
          reason: 'Support physics curriculum',
          priority: 'medium'
        }
      ],
      categoriesToExpand: topCategories.slice(0, 3).map(cat => ({
        category: cat.category,
        currentBooks: cat.totalBooks,
        demandGap: Math.floor(cat.totalBooks * 0.2),
        suggestedAdditions: Math.floor(cat.totalBooks * 0.1)
      })),
      totalBudgetRequired: 500,
      budgetBreakdown: {
        'STEM': 300,
        'Literature': 150,
        'Reference': 50
      }
    },
    categoryPerformance: {
      topPerforming: topCategories,
      underperforming: Object.entries(categoryStats)
        .filter(([_, stats]: [string, any]) => stats.borrowCount === 0)
        .slice(0, 3)
        .map(([category, stats]: [string, any]) => ({
          category,
          totalBooks: stats.totalBooks,
          borrowRate: 0,
          improvementSuggestions: [`Promote ${category} section`, 'Create reading lists']
        })),
      diversificationOpportunities: ['Consider adding digital resources', 'Expand multicultural collection']
    },
    spaceUtilization: {
      shelfUsage: 75,
      overcrowdedCategories: topCategories.slice(0, 2).map(cat => ({
        category: cat.category,
        bookCount: cat.totalBooks,
        availableSpace: 'Limited',
        recommendation: 'Reorganize shelves for better access'
      })),
      underutilizedAreas: [
        { location: 'Main Hall', currentUsage: 40, potentialCapacity: 80 }
      ],
      reorganizationSuggestions: ['Implement genre-based shelving', 'Create comfortable reading zones']
    },
    alerts,
    insights: {
      keyHighlights: [
        `${totalBooks} books in collection`,
        `${availableCopies} copies available`,
        `${borrowals.length} borrowals in last 30 days`
      ],
      opportunities: [
        'Expand popular categories',
        'Implement digital catalog',
        'Create reading programs'
      ],
      priorities: [
        { title: 'Restock out-of-stock items', urgency: 'high', impact: 'high' },
        { title: 'Reduce overdue rate', urgency: 'medium', impact: 'medium' },
        { title: 'Expand collection diversity', urgency: 'low', impact: 'medium' }
      ]
    },
    generatedAt: new Date()
  }
}

export async function GET() {
  try {
    const [books, borrowals] = await Promise.all([
      db.book.findMany({
        orderBy: {
          title: 'asc',
        },
      }),
      db.libraryBorrowal.findMany({
        where: {
          borrowDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          student: true,
          book: true
        },
        orderBy: {
          borrowDate: 'desc'
        },
        take: 100
      })
    ])

    const libraryData = {
      books: books.map(book => ({
        id: book.id,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        category: book.category,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        location: book.location || 'Unknown',
        publisher: book.publisher,
        publicationYear: book.publicationYear,
        createdAt: new Date().toISOString()
      })),
      borrowals: borrowals.map(borrowal => ({
        id: borrowal.id,
        bookId: borrowal.bookId,
        studentId: borrowal.studentId,
        borrowDate: borrowal.borrowDate.toISOString(),
        dueDate: borrowal.dueDate.toISOString(),
        returnDate: borrowal.returnDate?.toISOString(),
        status: borrowal.status as 'Borrowed' | 'Returned' | 'Overdue',
        fine: borrowal.fine
      }))
    }

    const predictionService = new LibraryPredictionService()
    const predictions = await predictionService.predictLibrary(libraryData)

    const fallbackPredictions = generateFallbackPredictions(books, borrowals)

    const safePredictions = {
      ...fallbackPredictions,
      ...predictions,
      overallHealth: { ...fallbackPredictions.overallHealth, ...predictions.overallHealth },
      popularBooks: {
        ...fallbackPredictions.popularBooks,
        ...predictions.popularBooks,
        trendingBooks: predictions.popularBooks?.trendingBooks || fallbackPredictions.popularBooks.trendingBooks,
        highDemandCategories: predictions.popularBooks?.highDemandCategories || fallbackPredictions.popularBooks.highDemandCategories,
        seasonalityInsights: predictions.popularBooks?.seasonalityInsights || fallbackPredictions.popularBooks.seasonalityInsights
      },
      stockAlerts: {
        ...fallbackPredictions.stockAlerts,
        ...predictions.stockAlerts,
        outOfStockBooks: predictions.stockAlerts?.outOfStockBooks || fallbackPredictions.stockAlerts.outOfStockBooks,
        lowStockBooks: predictions.stockAlerts?.lowStockBooks || fallbackPredictions.stockAlerts.lowStockBooks
      },
      borrowingPatterns: {
        ...fallbackPredictions.borrowingPatterns,
        ...predictions.borrowingPatterns,
        peakBorrowingTimes: predictions.borrowingPatterns?.peakBorrowingTimes || fallbackPredictions.borrowingPatterns.peakBorrowingTimes,
        frequentBorrowers: predictions.borrowingPatterns?.frequentBorrowers || fallbackPredictions.borrowingPatterns.frequentBorrowers
      },
      acquisitionRecommendations: {
        ...fallbackPredictions.acquisitionRecommendations,
        ...predictions.acquisitionRecommendations,
        recommendedPurchases: predictions.acquisitionRecommendations?.recommendedPurchases || fallbackPredictions.acquisitionRecommendations.recommendedPurchases,
        categoriesToExpand: predictions.acquisitionRecommendations?.categoriesToExpand || fallbackPredictions.acquisitionRecommendations.categoriesToExpand
      },
      categoryPerformance: {
        ...fallbackPredictions.categoryPerformance,
        ...predictions.categoryPerformance,
        topPerforming: predictions.categoryPerformance?.topPerforming || fallbackPredictions.categoryPerformance.topPerforming,
        underperforming: predictions.categoryPerformance?.underperforming || fallbackPredictions.categoryPerformance.underperforming
      },
      spaceUtilization: {
        ...fallbackPredictions.spaceUtilization,
        ...predictions.spaceUtilization,
        overcrowdedCategories: predictions.spaceUtilization?.overcrowdedCategories || fallbackPredictions.spaceUtilization.overcrowdedCategories,
        underutilizedAreas: predictions.spaceUtilization?.underutilizedAreas || fallbackPredictions.spaceUtilization.underutilizedAreas
      },
      alerts: predictions.alerts || fallbackPredictions.alerts,
      insights: {
        ...fallbackPredictions.insights,
        ...predictions.insights,
        keyHighlights: predictions.insights?.keyHighlights || fallbackPredictions.insights.keyHighlights,
        opportunities: predictions.insights?.opportunities || fallbackPredictions.insights.opportunities,
        priorities: predictions.insights?.priorities || fallbackPredictions.insights.priorities
      }
    }

    return NextResponse.json(safePredictions)
  } catch (error) {
    console.error('[PREDICTIONS_GET]', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
      console.log('[PREDICTIONS_GET] Using fallback predictions due to API quota limit')

      const [books, borrowals] = await Promise.all([
        db.book.findMany({
          orderBy: {
            title: 'asc',
          },
        }),
        db.libraryBorrowal.findMany({
          where: {
            borrowDate: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
          },
          include: {
            student: true,
            book: true
          },
          orderBy: {
            borrowDate: 'desc'
          },
          take: 100
        })
      ])

      const fallbackPredictions = generateFallbackPredictions(books, borrowals)

      return NextResponse.json(fallbackPredictions)
    }

    return new NextResponse(JSON.stringify({ error: 'Internal Error', details: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
