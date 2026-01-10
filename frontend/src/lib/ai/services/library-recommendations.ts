import { GeminiClient } from '../gemini-client'
import { db } from '@/lib/db'
import { validateStudentData, validateLibraryData } from '../utils/data-validation'

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
  private dataCache: Map<string, { data: any; timestamp: number }> = new Map()
  private readonly CACHE_TTL = 600000

  constructor() {
    this.client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.5,
      maxOutputTokens: 1024
    })
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.dataCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data as T
    }
    return null
  }

  private setCachedData<T>(key: string, data: T): void {
    this.dataCache.set(key, { data, timestamp: Date.now() })
  }

  async loadAllBooks(): Promise<Book[]> {
    const cacheKey = 'all_books'
    const cached = this.getCachedData<Book[]>(cacheKey)
    if (cached) return cached

    const books = await db.book.findMany({
      select: {
        id: true,
        isbn: true,
        title: true,
        author: true,
        publisher: true,
        category: true,
        language: true,
        pageCount: true,
        totalCopies: true,
        availableCopies: true,
        location: true,
        description: true
      }
    })

    this.setCachedData(cacheKey, books)
    return books
  }

  async loadStudentBorrowingHistory(studentId: string): Promise<BorrowingHistory[]> {
    const cacheKey = `borrowing_history_${studentId}`
    const cached = this.getCachedData<BorrowingHistory[]>(cacheKey)
    if (cached) return cached

    const borrowals = await db.libraryBorrowal.findMany({
      where: { studentId },
      include: {
        book: {
          select: {
            id: true,
            isbn: true,
            title: true,
            author: true,
            category: true,
            language: true
          }
        }
      },
      orderBy: { borrowDate: 'desc' },
      take: 50
    })

    const history: BorrowingHistory[] = borrowals.map(b => ({
      id: b.id,
      bookId: b.bookId,
      bookTitle: b.book.title,
      bookAuthor: b.book.author,
      bookCategory: b.book.category,
      borrowDate: b.borrowDate.toISOString(),
      returnDate: b.returnDate?.toISOString() || null,
      dueDate: b.dueDate.toISOString(),
      isReturned: b.returnDate !== null,
      isOverdue: b.returnDate === null && b.dueDate < new Date()
    }))

    this.setCachedData(cacheKey, history)
    return history
  }

  async loadStudentProfile(studentId: string): Promise<StudentProfile> {
    const cacheKey = `student_profile_${studentId}`
    const cached = this.getCachedData<StudentProfile>(cacheKey)
    if (cached) return cached

    const [student, examResults] = await Promise.all([
      db.student.findUnique({
        where: { id: studentId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          rollNumber: true,
          grade: { select: { name: true } },
          section: { select: { name: true } }
        }
      }),
      db.examResult.findMany({
        where: { studentId },
        include: {
          examPaper: {
            include: {
              subject: { select: { name: true } }
            }
          }
        },
        orderBy: {
          examPaper: { examDate: 'desc' }
        },
        take: 10
      })
    ])

    if (!student) {
      throw new Error('Student not found')
    }

    const strongSubjects: string[] = []
    const weakSubjects: string[] = []
    const subjectPerformance = new Map<string, { sum: number; count: number }>()

    examResults.forEach(r => {
      const subject = r.examPaper.subject.name
      if (!subjectPerformance.has(subject)) {
        subjectPerformance.set(subject, { sum: 0, count: 0 })
      }
      const stats = subjectPerformance.get(subject)!
      stats.sum += r.percentage
      stats.count += 1
    })

    subjectPerformance.forEach((stats, subject) => {
      const avg = stats.sum / stats.count
      if (avg >= 80) strongSubjects.push(subject)
      else if (avg < 60) weakSubjects.push(subject)
    })

    const profile: StudentProfile = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      grade: student.grade.name,
      section: student.section.name,
      rollNumber: student.rollNumber,
      strongSubjects,
      weakSubjects,
      averagePerformance: subjectPerformance.size > 0
        ? Array.from(subjectPerformance.values()).reduce((acc, stats) => acc + stats.sum / stats.count, 0) / subjectPerformance.size
        : 0
    }

    this.setCachedData(cacheKey, profile)
    return profile
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

  async getRecommendationsForStudent(studentId: string): Promise<RecommendationResponse> {
    const [profile, borrowingHistory, allBooks] = await Promise.all([
      this.loadStudentProfile(studentId),
      this.loadStudentBorrowingHistory(studentId),
      this.loadAllBooks()
    ])

    const studentValidation = validateStudentData({
      id: profile.studentId,
      firstName: profile.name.split(' ')[0],
      lastName: profile.name.split(' ').slice(1).join(' '),
      grade: profile.grade,
      section: profile.section
    })

    if (!studentValidation.isValid) {
      console.warn('Student data validation warnings:', studentValidation.warnings)
    }

    const libraryValidation = validateLibraryData({
      books: allBooks,
      borrowingHistory: borrowingHistory
    })

    if (!libraryValidation.isValid) {
      console.warn('Library data validation issues:', libraryValidation.issues)
      console.warn('Library data validation warnings:', libraryValidation.warnings)
    }

    return this.analyzeStudentProfile(profile, borrowingHistory, allBooks)
  }

  async getRecommendationsForStudentLegacy(
    studentId: string,
    borrowingHistory: BorrowingHistory[],
    allBooks: Book[]
  ): Promise<RecommendationResponse> {
    const profile = await this.loadStudentProfile(studentId)
    return this.analyzeStudentProfile(profile, borrowingHistory, allBooks)
  }
}

export const libraryRecommendationsService = new LibraryRecommendationsService()
