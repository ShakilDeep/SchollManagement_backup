import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { libraryRecommendationService } from '@/lib/ai/services/library-recommendations'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, subject, count = 5 } = body

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'studentId is required'
        },
        { status: 400 }
      )
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        grade: true,
        section: true,
        bookIssues: {
          include: {
            book: {
              include: {
                category: true
              }
            }
          },
          orderBy: { issueDate: 'desc' }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    const recentBooksRead = student.bookIssues
      .filter(issue => issue.returnDate)
      .map(issue => ({
        title: issue.book.title,
        author: issue.book.author,
        genre: issue.book.category?.name || 'General',
        rating: 4,
        dateRead: issue.returnDate.toISOString().split('T')[0]
      }))

    const interests = recentBooksRead
      .map(book => book.genre)
      .filter((genre, index, self) => self.indexOf(genre) === index)

    const examResults = await db.examResult.findMany({
      where: {
        studentId: studentId
      },
      include: {
        examPaper: {
          include: {
            subject: true
          }
        }
      },
      take: 10
    })

    const subjectPerformance = examResults.reduce((acc, result) => {
      const subject = result.examPaper.subject.name
      if (!acc[subject]) {
        acc[subject] = []
      }
      acc[subject].push(result.percentage)
      return acc
    }, {} as Record<string, number[]>)

    const subjectsAverage: Record<string, number> = {}
    Object.entries(subjectPerformance).forEach(([subject, scores]) => {
      subjectsAverage[subject] = scores.reduce((a, b) => a + b, 0) / scores.length
    })

    const averagePerformance = Object.values(subjectsAverage).length > 0
      ? Object.values(subjectsAverage).reduce((a, b) => a + b, 0) / Object.values(subjectsAverage).length
      : 0

    const studentProfile = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade.name,
      interests: interests.length > 0 ? interests : ['General', 'Science', 'Mathematics', 'Literature'],
      readingLevel: student.grade.name === 'Grade 10' || student.grade.name === 'Grade 11' || student.grade.name === 'Grade 12' ? 'advanced' as const : 'intermediate' as const,
      recentBooksRead,
      academicPerformance: {
        subjects: subjectsAverage,
        average: averagePerformance
      }
    }

    const allBooks = await db.book.findMany({
      include: {
        category: true
      }
    })

    const libraryInventory = {
      books: allBooks.map(book => {
        const availableCopies = book.totalCopies - (book.issuedCopies || 0)
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.category?.name || 'General',
          subgenres: [book.category?.name || 'General'],
          difficulty: book.category?.name?.includes('Advanced') ? 'hard' as const : 'medium' as const,
          pageCount: book.pages || 200,
          availability: availableCopies > 0 ? 'available' as const : 'borrowed' as const,
          ageGroup: [student.grade.name],
          topics: [book.category?.name || 'General'],
          awards: []
        }
      })
    }

    let recommendations

    if (subject) {
      recommendations = await libraryRecommendationService.generateCurriculumRecommendations(
        studentProfile,
        libraryInventory,
        subject
      )
    } else {
      recommendations = await libraryRecommendationService.generateRecommendations(
        studentProfile,
        libraryInventory,
        count
      )
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    })
  } catch (error) {
    console.error('Library recommendations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate book recommendations'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const subject = searchParams.get('subject')
    const count = parseInt(searchParams.get('count') || '5')

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          error: 'studentId is required'
        },
        { status: 400 }
      )
    }

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        grade: true,
        section: true,
        bookIssues: {
          include: {
            book: {
              include: {
                category: true
              }
            }
          },
          orderBy: { issueDate: 'desc' }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    const recentBooksRead = student.bookIssues
      .filter(issue => issue.returnDate)
      .map(issue => ({
        title: issue.book.title,
        author: issue.book.author,
        genre: issue.book.category?.name || 'General',
        rating: 4,
        dateRead: issue.returnDate.toISOString().split('T')[0]
      }))

    const interests = recentBooksRead
      .map(book => book.genre)
      .filter((genre, index, self) => self.indexOf(genre) === index)

    const studentProfile = {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      grade: student.grade.name,
      interests: interests.length > 0 ? interests : ['General', 'Science', 'Mathematics', 'Literature'],
      readingLevel: student.grade.name === 'Grade 10' || student.grade.name === 'Grade 11' || student.grade.name === 'Grade 12' ? 'advanced' : 'intermediate',
      recentBooksRead
    }

    const allBooks = await db.book.findMany({
      include: {
        category: true
      }
    })

    const libraryInventory = {
      books: allBooks.map(book => {
        const availableCopies = book.totalCopies - (book.issuedCopies || 0)
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.category?.name || 'General',
          subgenres: [book.category?.name || 'General'],
          difficulty: book.category?.name?.includes('Advanced') ? 'hard' : 'medium',
          pageCount: book.pages || 200,
          availability: availableCopies > 0 ? 'available' : 'borrowed',
          ageGroup: [student.grade.name],
          topics: [book.category?.name || 'General'],
          awards: []
        }
      })
    }

    let recommendations

    if (subject) {
      recommendations = await libraryRecommendationService.generateCurriculumRecommendations(
        studentProfile,
        libraryInventory,
        subject
      )
    } else {
      recommendations = await libraryRecommendationService.generateRecommendations(
        studentProfile,
        libraryInventory,
        count
      )
    }

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length
    })
  } catch (error) {
    console.error('Library recommendations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate book recommendations'
      },
      { status: 500 }
    )
  }
}
