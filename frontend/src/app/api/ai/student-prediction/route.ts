import { NextRequest, NextResponse } from 'next/server'
import { studentPredictionService } from '@/lib/ai/services/student-prediction-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      )
    }

    const prediction = await studentPredictionService.generatePrediction(studentId)

    return NextResponse.json({
      studentId: prediction.studentId,
      riskLevel: prediction.riskLevel,
      riskFactors: prediction.riskFactors,
      predictedGrade: prediction.predictedGrade,
      confidence: prediction.confidence,
      recommendations: prediction.recommendations
    })
  } catch (error) {
    console.error('Student prediction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
