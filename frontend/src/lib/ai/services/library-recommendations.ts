import { GeminiClient } from '../gemini-client'

interface Book {
  id: string
  isbn: string
  title: string
  author: string
  category: string
  totalCopies: number
  availableCopies: number
  location: string
  publisher?: string
  publicationYear?: number
}

interface BorrowingHistory {
  id: string
  bookTitle: string
  bookIsbn: string
  borrowDate: string
  returnDate?: string
  status: 'Borrowed' | 'Returned' | 'Overdue'
}

interface StudentProfile {
  id: string
  firstName: string
  lastName: string
  grade: string
  section: string
  rollNumber: string
}

interface BookRecommendation {
  book: Book
  reason: string
  matchScore: number
  categoryMatch: boolean
  authorMatch: boolean
}

interface RecommendationResponse {
  student: StudentProfile
  recommendations: BookRecommendation[]
  totalRecommendations: number
  analysis: {
    readingLevel: string
    preferredCategories: string[]
    readingFrequency: string
  }
}

export class LibraryRecommendationsService {
  private client: GeminiClient

  constructor() {
    this.client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.4,
      maxOutputTokens: 2048
    })
  }

  async analyzeStudentProfile(
    studentProfile: StudentProfile,
    borrowingHistory: BorrowingHistory[],
    allBooks: Book[]
  ): Promise<RecommendationResponse> {
    try {
      const prompt = `
        You are a school librarian with expertise in recommending books based on student reading patterns. 

        Student Profile:
        - Name: ${studentProfile.firstName} ${studentProfile.lastName}
        - Grade: ${studentProfile.grade} ${studentProfile.section}
        - Roll Number: ${studentProfile.rollNumber}

        Borrowing History (${borrowingHistory.length} books):
        ${borrowingHistory.map(h => `- ${h.bookTitle} (ISBN: ${h.bookIsbn}) - ${h.status}`).join('\n')}

        Available Books (${allBooks.length} total):
        ${allBooks.slice(0, 50).map(b => `- ${b.title} by ${b.author} (${b.category}) - ${b.availableCopies} copies available`).join('\n')}

        Analyze this student's reading patterns and provide personalized book recommendations. Consider:
        1. Reading level appropriate for grade ${studentProfile.grade}
        2. Categories they've shown interest in
        3. Reading frequency and patterns
        4. Book availability (only recommend books with available copies)

        For each recommendation, provide:
        - Book title, author, and category
        - Why this book is recommended for this specific student
        - Match score (0.1-1.0) indicating how well it fits
        - Whether it matches their preferred categories
        - Whether they've read the same author before

        Respond in JSON format:
        {
          "analysis": {
            "readingLevel": string,
            "preferredCategories": string[],
            "readingFrequency": string
          },
          "recommendations": [
            {
              "book": {
                "title": string,
                "author": string,
                "category": string,
                "isbn": string
              },
              "reason": string,
              "matchScore": number,
              "categoryMatch": boolean,
              "authorMatch": boolean
            }
          ]
        }

        Provide 5-8 recommendations. Focus on books that are currently available.
      `

      const result = await this.client.generateJSON<{
        analysis: RecommendationResponse['analysis']
        recommendations: Array<{
          book: { title: string; author: string; category: string; isbn: string }
          reason: string
          matchScore: number
          categoryMatch: boolean
          authorMatch: boolean
        }>
      }>(prompt)

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze student profile')
      }

      const recommendations: BookRecommendation[] = result.data.recommendations.map(rec => {
        const book = allBooks.find(b => b.title === rec.book.title && b.author === rec.book.author)
        if (!book) return null

        return {
          book,
          reason: rec.reason,
          matchScore: rec.matchScore,
          categoryMatch: rec.categoryMatch,
          authorMatch: rec.authorMatch
        }
      }).filter((rec): rec is BookRecommendation => rec !== null)

      return {
        student: studentProfile,
        recommendations,
        totalRecommendations: recommendations.length,
        analysis: result.data.analysis
      }
    } catch (error) {
      return this.generateFallbackRecommendations(studentProfile, borrowingHistory, allBooks)
    }
  }

  private generateFallbackRecommendations(
    studentProfile: StudentProfile,
    borrowingHistory: BorrowingHistory[],
    allBooks: Book[]
  ): RecommendationResponse {
    const borrowedCategories = new Set<string>()
    borrowingHistory.forEach(h => {
      const book = allBooks.find(b => b.isbn === h.bookIsbn)
      if (book) borrowedCategories.add(book.category)
    })

    const preferredCategories = borrowedCategories.size > 0 
      ? Array.from(borrowedCategories) 
      : ['Computer Science', 'Programming', 'Science', 'Mathematics']

    const readingFrequency = borrowingHistory.length > 5 ? 'High' 
      : borrowingHistory.length > 2 ? 'Medium' 
      : 'Low'

    const availableBooks = allBooks.filter(b => b.availableCopies > 0)

    const recommendations: BookRecommendation[] = availableBooks
      .filter(book => preferredCategories.includes(book.category))
      .sort((a, b) => b.availableCopies - a.availableCopies)
      .slice(0, 8)
      .map(book => ({
        book,
        reason: this.generateFallbackReason(book, studentProfile, preferredCategories),
        matchScore: preferredCategories.includes(book.category) ? 0.8 : 0.6,
        categoryMatch: preferredCategories.includes(book.category),
        authorMatch: borrowingHistory.some(h => {
          const borrowedBook = allBooks.find(b => b.isbn === h.bookIsbn)
          return borrowedBook?.author === book.author
        })
      }))

    return {
      student: studentProfile,
      recommendations,
      totalRecommendations: recommendations.length,
      analysis: {
        readingLevel: this.determineReadingLevel(studentProfile.grade),
        preferredCategories,
        readingFrequency
      }
    }
  }

  private generateFallbackReason(
    book: Book,
    student: StudentProfile,
    preferredCategories: string[]
  ): string {
    const categoryMatch = preferredCategories.includes(book.category)
    const gradeLevel = parseInt(student.grade.replace(/\D/g, '')) || 1

    if (categoryMatch) {
      return `Matches your interest in ${book.category}. A great choice for grade ${gradeLevel} students.`
    }

    if (book.category === 'Computer Science' || book.category === 'Programming') {
      return `Build your technical skills with this ${book.category} resource. Suitable for your grade level.`
    }

    return `Expanding your horizons with ${book.category}. Available now and recommended for your grade level.`
  }

  private determineReadingLevel(grade: string): string {
    const gradeLevel = parseInt(grade.replace(/\D/g, '')) || 1

    if (gradeLevel <= 3) return 'Beginner'
    if (gradeLevel <= 6) return 'Intermediate'
    if (gradeLevel <= 9) return 'Advanced'
    return 'Expert'
  }

  async getRecommendationsForStudent(
    studentId: string,
    borrowingHistory: BorrowingHistory[],
    allBooks: Book[]
  ): Promise<RecommendationResponse> {
    const { db } = await import('@/lib/db')
    
    const student = await db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        grade: {
          select: {
            name: true
          }
        },
        section: {
          select: {
            name: true
          }
        }
      }
    })

    if (!student) {
      throw new Error('Student not found')
    }

    const studentProfile: StudentProfile = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade.name,
      section: student.section.name,
      rollNumber: student.rollNumber
    }

    return this.analyzeStudentProfile(studentProfile, borrowingHistory, allBooks)
  }
}

export const libraryRecommendationsService = new LibraryRecommendationsService()
