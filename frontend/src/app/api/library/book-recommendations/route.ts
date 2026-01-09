import { NextRequest, NextResponse } from 'next/server';
import { bookRecommendationService } from '@/lib/ai/services/book-recommendation-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }

    const recommendations = await bookRecommendationService.generateRecommendations(studentId);

    return NextResponse.json({
      studentId: recommendations.studentId,
      recommendations: recommendations.recommendations.map(rec => ({
        bookId: rec.bookId,
        isbn: rec.isbn,
        title: rec.title,
        author: rec.author,
        category: rec.category,
        availableCopies: rec.availableCopies,
        matchScore: rec.matchScore,
        matchReason: rec.matchReason
      })),
      readingProfile: recommendations.readingProfile,
      confidence: recommendations.confidence
    });
  } catch (error) {
    console.error('Book recommendation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
