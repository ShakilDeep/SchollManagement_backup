import { NextRequest, NextResponse } from 'next/server'
import { dashboardPredictionService } from '@/lib/ai/services/dashboard-prediction'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const forceRefresh = searchParams.get('refresh') === 'true'

    const dashboardData = forceRefresh 
      ? undefined 
      : await dashboardPredictionService.loadDashboardData()

    const predictions = await dashboardPredictionService.generateDashboardPredictions(dashboardData)

    return NextResponse.json({
      success: true,
      data: predictions
    })
  } catch (error) {
    console.error('Dashboard predictions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate predictions'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { dashboardData } = body

    if (!dashboardData) {
      return NextResponse.json(
        {
          success: false,
          error: 'dashboardData is required in request body'
        },
        { status: 400 }
      )
    }

    const validation = await dashboardPredictionService.validateDataQuality(dashboardData)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data validation failed',
          issues: validation.issues
        },
        { status: 400 }
      )
    }

    const predictions = await dashboardPredictionService.generateDashboardPredictions(dashboardData)

    return NextResponse.json({
      success: true,
      data: predictions
    })
  } catch (error) {
    console.error('Dashboard predictions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate predictions'
      },
      { status: 500 }
    )
  }
}
