import { NextRequest, NextResponse } from 'next/server'
import { timetablePredictionService } from '@/lib/ai/services/timetable-prediction-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sectionId = searchParams.get('sectionId')

    if (!sectionId) {
      return NextResponse.json(
        { error: 'sectionId is required' },
        { status: 400 }
      )
    }

    const predictions = await timetablePredictionService.generatePredictions(sectionId)

    if (!predictions) {
      return NextResponse.json(
        { error: 'Insufficient data to generate predictions' },
        { status: 404 }
      )
    }

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Error generating timetable predictions:', error)
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sectionId, action } = body

    if (!sectionId) {
      return NextResponse.json(
        { error: 'sectionId is required' },
        { status: 400 }
      )
    }

    if (action === 'optimize') {
      const optimization = await timetablePredictionService.optimizeSchedule(sectionId)

      if (!optimization) {
        return NextResponse.json(
          { error: 'Insufficient data to optimize schedule' },
          { status: 404 }
        )
      }

      return NextResponse.json(optimization)
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "optimize" for schedule optimization' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing timetable action:', error)
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    )
  }
}
