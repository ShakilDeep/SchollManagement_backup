import { NextRequest, NextResponse } from 'next/server'
import { StaffPredictionService } from '@/lib/ai/services/staff-prediction-service'

const staffPredictionService = new StaffPredictionService()

export async function GET(request: NextRequest) {
  try {
    const predictions = await staffPredictionService.generatePredictions()

    if (!predictions) {
      return NextResponse.json(
        { error: 'Insufficient data to generate predictions' },
        { status: 404 }
      )
    }

    return NextResponse.json(predictions)
  } catch (error) {
    console.error('Error generating staff predictions:', error)
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}
