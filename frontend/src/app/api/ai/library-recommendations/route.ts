import { NextRequest, NextResponse } from 'next/server'
import { libraryRecommendationService } from '@/lib/ai/services/library-recommendations'
import { fetchAPI } from '@/lib/api/client'

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

    // Fetch student data from Django backend API
    const studentResponse = await fetchAPI<any>(`/students/${studentId}/`)
    const student = studentResponse

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    // Fetch grades for grade name
    const gradesResponse = await fetchAPI<{ results: any[] }>('/grades/')
    const grades = gradesResponse.results || []
    const grade = grades.find(g => g.id === (student.grade || student.gradeId || student.grade_id))

    // Fetch borrowals to get book history
    const borrowalsResponse = await fetchAPI<{ results: any[] }>(`/library/borrowals/?student=${studentId}`)
    const borrowals = borrowalsResponse.results || []

    // Get recently returned books (with return dates)
    const returnedBorrowals = borrowals.filter(b => b.returnDate || b.return_date)

    // Fetch all books for library inventory
    const booksResponse = await fetchAPI<{ results: any[] }>('/library/books/')
    const allBooks = booksResponse.results || []

    const recentBooksRead = returnedBorrowals.map(issue => {
      const book = allBooks.find(b => b.id === (issue.book || issue.bookId || issue.book_id))
      return {
        title: book?.title || 'Unknown',
        author: book?.author || 'Unknown',
        genre: book?.category || book?.category_name || 'General',
        rating: 4,
        dateRead: (issue.returnDate || issue.return_date || issue.created_at || '').toString().split('T')[0]
      }
    })

    const interests = recentBooksRead
      .map(book => book.genre)
      .filter((genre, index, self) => self.indexOf(genre) === index)

    // Fetch exam results for subject performance
    const examResultsResponse = await fetchAPI<{ results: any[] }>(`/exam-results/?student=${studentId}`)
    const examResults = examResultsResponse.results || []

    // Fetch subjects for subject names
    const subjectsResponse = await fetchAPI<{ results: any[] }>('/curriculum/subjects/')
    const subjects = subjectsResponse.results || []

    const subjectPerformance = examResults.reduce((acc, result) => {
      // Find the subject from exam paper
      const examPaperId = result.examPaper || result.exam_paper_id || result.examPaperId
      let subjectName = 'Unknown'

      // Try to find subject from exam paper (if we had exam papers endpoint)
      // For now, use a default approach
      if (result.subjectName || result.subject_name) {
        subjectName = result.subjectName || result.subject_name
      }

      if (!acc[subjectName]) {
        acc[subjectName] = []
      }
      acc[subjectName].push(result.percentage || 0)
      return acc
    }, {} as Record<string, number[]>)

    const subjectsAverage: Record<string, number> = {}
    Object.entries(subjectPerformance).forEach(([subj, scores]) => {
      subjectsAverage[subj] = scores.reduce((a, b) => a + b, 0) / scores.length
    })

    const averagePerformance = Object.values(subjectsAverage).length > 0
      ? Object.values(subjectsAverage).reduce((a, b) => a + b, 0) / Object.values(subjectsAverage).length
      : 0

    const gradeName = grade?.name || student.grade_name || 'Unknown'

    const studentProfile = {
      id: student.id,
      name: `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim(),
      grade: gradeName,
      interests: interests.length > 0 ? interests : ['General', 'Science', 'Mathematics', 'Literature'],
      readingLevel: gradeName === 'Grade 10' || gradeName === 'Grade 11' || gradeName === 'Grade 12' ? 'advanced' as const : 'intermediate' as const,
      recentBooksRead,
      academicPerformance: {
        subjects: subjectsAverage,
        average: averagePerformance
      }
    }

    const libraryInventory = {
      books: allBooks.map(book => {
        const issuedCopies = book.issuedCopies || book.issued_copies || 0
        const availableCopies = (book.totalCopies || book.total_copies || 1) - issuedCopies
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.category || book.category_name || 'General',
          subgenres: [book.category || book.category_name || 'General'],
          difficulty: (book.category || book.category_name || '').includes('Advanced') ? 'hard' as const : 'medium' as const,
          pageCount: book.pages || book.page_count || 200,
          availability: availableCopies > 0 ? 'available' as const : 'borrowed' as const,
          ageGroup: [gradeName],
          topics: [book.category || book.category_name || 'General'],
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

    // Fetch student data from Django backend API
    const studentResponse = await fetchAPI<any>(`/students/${studentId}/`)
    const student = studentResponse

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          error: 'Student not found'
        },
        { status: 404 }
      )
    }

    // Fetch grades for grade name
    const gradesResponse = await fetchAPI<{ results: any[] }>('/grades/')
    const grades = gradesResponse.results || []
    const grade = grades.find(g => g.id === (student.grade || student.gradeId || student.grade_id))

    // Fetch borrowals to get book history
    const borrowalsResponse = await fetchAPI<{ results: any[] }>(`/library/borrowals/?student=${studentId}`)
    const borrowals = borrowalsResponse.results || []

    // Get recently returned books (with return dates)
    const returnedBorrowals = borrowals.filter(b => b.returnDate || b.return_date)

    // Fetch all books for library inventory
    const booksResponse = await fetchAPI<{ results: any[] }>('/library/books/')
    const allBooks = booksResponse.results || []

    const recentBooksRead = returnedBorrowals.map(issue => {
      const book = allBooks.find(b => b.id === (issue.book || issue.bookId || issue.book_id))
      return {
        title: book?.title || 'Unknown',
        author: book?.author || 'Unknown',
        genre: book?.category || book?.category_name || 'General',
        rating: 4,
        dateRead: (issue.returnDate || issue.return_date || issue.created_at || '').toString().split('T')[0]
      }
    })

    const interests = recentBooksRead
      .map(book => book.genre)
      .filter((genre, index, self) => self.indexOf(genre) === index)

    const gradeName = grade?.name || student.grade_name || 'Unknown'

    const studentProfile = {
      id: student.id,
      name: `${student.firstName || student.first_name || ''} ${student.lastName || student.last_name || ''}`.trim(),
      grade: gradeName,
      interests: interests.length > 0 ? interests : ['General', 'Science', 'Mathematics', 'Literature'],
      readingLevel: gradeName === 'Grade 10' || gradeName === 'Grade 11' || gradeName === 'Grade 12' ? 'advanced' : 'intermediate',
      recentBooksRead
    }

    const libraryInventory = {
      books: allBooks.map(book => {
        const issuedCopies = book.issuedCopies || book.issued_copies || 0
        const availableCopies = (book.totalCopies || book.total_copies || 1) - issuedCopies
        return {
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.category || book.category_name || 'General',
          subgenres: [book.category || book.category_name || 'General'],
          difficulty: (book.category || book.category_name || '').includes('Advanced') ? 'hard' : 'medium',
          pageCount: book.pages || book.page_count || 200,
          availability: availableCopies > 0 ? 'available' : 'borrowed',
          ageGroup: [gradeName],
          topics: [book.category || book.category_name || 'General'],
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
