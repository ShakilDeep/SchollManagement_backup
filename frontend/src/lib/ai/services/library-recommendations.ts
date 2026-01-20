import { GeminiClient } from '../gemini-client'
import { fetchAPI } from '@/lib/api/client'
import { validateStudentData, validateLibraryData } from '../utils/data-validation'

interface Book {
  id: string
  isbn: string
  title: string
  author: string
  genre: string
  category: string
  subgenres: string[]
  difficulty: 'easy' | 'medium' | 'hard'
  pageCount: number
  availability: 'available' | 'borrowed'
  ageGroup: string[]
  topics: string[]
  awards: string[]
}

interface StudentProfile {
  id: string
  name: string
  grade: string
  interests: string[]
  readingLevel: 'beginner' | 'intermediate' | 'advanced'
  recentBooksRead: Array<{
    title: string
    author: string
    genre: string
    rating: number
    dateRead: string
  }>
  academicPerformance?: {
    subjects: Record<string, number>
    average: number
  }
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

interface LibraryInventory {
  books: Book[]
}

interface CurriculumRecommendations {
  recommendations: BookRecommendation[]
  subject: string
  strength: number
  improvementAreas: string[]
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

  async generateRecommendations(
    studentProfile: StudentProfile,
    libraryInventory: LibraryInventory,
    count: number = 5
  ): Promise<BookRecommendation[]> {
    try {
      const prompt = `
        You are a school librarian with expertise in recommending books based on student reading patterns.

        Student Profile:
        - Name: ${studentProfile.name}
        - Grade: ${studentProfile.grade}
        - Reading Level: ${studentProfile.readingLevel}
        - Interests: ${studentProfile.interests.join(', ')}

        Recently Read Books (${studentProfile.recentBooksRead.length} books):
        ${studentProfile.recentBooksRead.map(b => `- ${b.title} by ${b.author} (${b.genre}) - Rating: ${b.rating}/5`).join('\n')}

        Available Books (${libraryInventory.books.length} total):
        ${libraryInventory.books.slice(0, 50).map(b => `- ${b.title} by ${b.author} (${b.genre}) - ${b.availability}`).join('\n')}

        Analyze this student's reading patterns and provide personalized book recommendations. Consider:
        1. Reading level appropriate for grade ${studentProfile.grade}
        2. Categories they've shown interest in (${studentProfile.interests.join(', ')})
        3. Reading frequency based on recent history
        4. Book availability (only recommend books that are available)

        For each recommendation, provide:
        - Book title, author, and genre
        - Why this book is recommended for this specific student
        - Match score (0.1-1.0) indicating how well it fits
        - Whether it matches their preferred categories
        - Whether they've read the same author before

        Respond in JSON format with ${count} recommendations:
        {
          "recommendations": [
            {
              "book": { "title": string, "author": string, "genre": string },
              "reason": string,
              "matchScore": number,
              "categoryMatch": boolean,
              "authorMatch": boolean
            }
          ]
        }
      `

      const result = await this.client.generateJSON<{
        recommendations: Array<{
          book: { title: string; author: string; genre: string }
          reason: string
          matchScore: number
          categoryMatch: boolean
          authorMatch: boolean
        }>
      }>(prompt)

      if (!result.success) {
        return this.generateFallbackRecommendations(studentProfile, libraryInventory, count)
      }

      const recommendations: BookRecommendation[] = result.data.recommendations
        .slice(0, count)
        .map(rec => {
          const book = libraryInventory.books.find(b => b.title === rec.book.title && b.author === rec.book.author)
          if (!book) return null

          return {
            book,
            reason: rec.reason,
            matchScore: rec.matchScore,
            categoryMatch: rec.categoryMatch,
            authorMatch: rec.authorMatch
          }
        })
        .filter((rec): rec is BookRecommendation => rec !== null)

      return recommendations.length > 0 ? recommendations : this.generateFallbackRecommendations(studentProfile, libraryInventory, count)
    } catch (error) {
      console.error('Error generating book recommendations:', error)
      return this.generateFallbackRecommendations(studentProfile, libraryInventory, count)
    }
  }

  async generateCurriculumRecommendations(
    studentProfile: StudentProfile,
    libraryInventory: LibraryInventory,
    subject: string
  ): Promise<BookRecommendation[]> {
    try {
      const subjectPerformance = studentProfile.academicPerformance?.subjects[subject] || 0
      const needsImprovement = subjectPerformance < 70

      const prompt = `
        You are a school librarian helping a student find books for ${subject} studies.

        Student Profile:
        - Name: ${studentProfile.name}
        - Grade: ${studentProfile.grade}
        - Reading Level: ${studentProfile.readingLevel}
        - ${subject} Performance: ${subjectPerformance}%
        - Needs Improvement: ${needsImprovement ? 'Yes' : 'No'}

        Available Books (${libraryInventory.books.length} total):
        ${libraryInventory.books.filter(b => b.topics.includes(subject) || b.genre.toLowerCase().includes(subject.toLowerCase())).slice(0, 30).map(b => `- ${b.title} by ${b.author} (${b.genre}) - ${b.availability}`).join('\n')}

        Recommend 5 books that will help this student with ${subject}. Consider:
        1. Current performance level (${subjectPerformance}%)
        2. Reading level (${studentProfile.readingLevel})
        3. Books appropriate for grade ${studentProfile.grade}
        4. Only available books

        ${needsImprovement ? 'Focus on foundational and supportive materials to help improve understanding.' : 'Focus on advanced materials to further strengthen understanding.'}

        Respond in JSON format:
        {
          "recommendations": [
            {
              "book": { "title": string, "author": string, "genre": string },
              "reason": string,
              "matchScore": number,
              "categoryMatch": boolean,
              "authorMatch": boolean
            }
          ]
        }
      `

      const result = await this.client.generateJSON<{
        recommendations: Array<{
          book: { title: string; author: string; genre: string }
          reason: string
          matchScore: number
          categoryMatch: boolean
          authorMatch: boolean
        }>
      }>(prompt)

      if (!result.success) {
        return this.generateFallbackRecommendations(studentProfile, libraryInventory, 5, subject)
      }

      const recommendations: BookRecommendation[] = result.data.recommendations
        .map(rec => {
          const book = libraryInventory.books.find(b => b.title === rec.book.title && b.author === rec.book.author)
          if (!book) return null

          return {
            book,
            reason: rec.reason,
            matchScore: rec.matchScore,
            categoryMatch: rec.categoryMatch,
            authorMatch: rec.authorMatch
          }
        })
        .filter((rec): rec is BookRecommendation => rec !== null)

      return recommendations.length > 0 ? recommendations : this.generateFallbackRecommendations(studentProfile, libraryInventory, 5, subject)
    } catch (error) {
      console.error('Error generating curriculum recommendations:', error)
      return this.generateFallbackRecommendations(studentProfile, libraryInventory, 5, subject)
    }
  }

  private generateFallbackRecommendations(
    studentProfile: StudentProfile,
    libraryInventory: LibraryInventory,
    count: number,
    subjectFilter?: string
  ): BookRecommendation[] {
    const borrowedCategories = new Set(studentProfile.interests)
    const preferredCategories = borrowedCategories.size > 0
      ? Array.from(borrowedCategories)
      : ['Computer Science', 'Programming', 'Science', 'Mathematics', 'Literature']

    const availableBooks = libraryInventory.books.filter(b => b.availability === 'available')

    let filteredBooks = availableBooks
    if (subjectFilter) {
      filteredBooks = availableBooks.filter(b =>
        b.topics.includes(subjectFilter) ||
        b.genre.toLowerCase().includes(subjectFilter.toLowerCase()) ||
        preferredCategories.some(cat => b.genre.toLowerCase().includes(cat.toLowerCase()))
      )
    } else {
      filteredBooks = availableBooks.filter(book =>
        preferredCategories.some(cat => book.genre.toLowerCase().includes(cat.toLowerCase()))
      )
    }

    const recommendations: BookRecommendation[] = filteredBooks
      .sort((a, b) => {
        // Prefer easier books for struggling students
        if (studentProfile.readingLevel === 'beginner') {
          return a.difficulty === 'easy' ? -1 : b.difficulty === 'easy' ? 1 : 0
        }
        return 0
      })
      .slice(0, count)
      .map(book => ({
        book,
        reason: this.generateFallbackReason(book, studentProfile, preferredCategories, subjectFilter),
        matchScore: preferredCategories.some(cat => book.genre.toLowerCase().includes(cat.toLowerCase())) ? 0.8 : 0.6,
        categoryMatch: preferredCategories.some(cat => book.genre.toLowerCase().includes(cat.toLowerCase())),
        authorMatch: studentProfile.recentBooksRead.some(h => h.author === book.author)
      }))

    return recommendations
  }

  private generateFallbackReason(
    book: Book,
    student: StudentProfile,
    preferredCategories: string[],
    subjectFilter?: string
  ): string {
    const categoryMatch = preferredCategories.some(cat => book.genre.toLowerCase().includes(cat.toLowerCase()))

    if (subjectFilter) {
      const performance = student.academicPerformance?.subjects[subjectFilter] || 0
      if (performance < 70) {
        return `This ${book.genre} book provides excellent foundational support for ${subjectFilter}. Perfect for building your understanding at your own pace.`
      }
      return `Expand your knowledge with this comprehensive ${book.genre} resource. Ideal for grade ${student.grade} students ready to advance.`
    }

    if (categoryMatch) {
      return `Matches your interest in ${book.genre}. A ${book.difficulty === 'easy' ? 'great starting point' : book.difficulty === 'hard' ? 'challenging choice' : 'solid choice'} for your reading level.`
    }

    if (student.readingLevel === 'beginner') {
      return `An accessible ${book.genre} book that will help build your confidence. Perfect for expanding your reading horizons.`
    }

    return `Explore new ideas with this ${book.genre} selection. Available now and suited to your grade level.`
  }

  async getRecommendationsForStudent(studentId: string): Promise<RecommendationResponse> {
    try {
      // Fetch student data from backend API
      const [studentResponse, borrowalsResponse, booksResponse] = await Promise.all([
        fetchAPI<any>(`/students/${studentId}/`),
        fetchAPI<{ results: any[] }>(`/library/borrowals/?student=${studentId}`),
        fetchAPI<{ results: any[] }>('/library/books/')
      ])

      const student = studentResponse
      const borrowals = borrowalsResponse.results || []
      const allBooks = (booksResponse.results || []).map((b: any) => ({
        id: b.id,
        isbn: b.isbn || '',
        title: b.title || 'Unknown',
        author: b.author || 'Unknown',
        genre: b.category || b.category_name || 'General',
        category: b.category || b.category_name || 'General',
        subgenres: [b.category || b.category_name || 'General'],
        difficulty: 'medium' as const,
        pageCount: b.pages || 200,
        availability: (b.available_copies || b.availableCopies || 0) > 0 ? 'available' : 'borrowed',
        ageGroup: [],
        topics: [b.category || b.category_name || 'General'],
        awards: []
      }))

      // Get returned books for reading history
      const returnedBorrowals = borrowals.filter((b: any) => b.returnDate || b.return_date)
      const recentBooksRead = returnedBorrowals.map((b: any) => {
        const book = allBooks.find(book => book.id === (b.book || b.bookId || b.book_id))
        return {
          title: book?.title || 'Unknown',
          author: book?.author || 'Unknown',
          genre: book?.genre || 'General',
          rating: 4,
          dateRead: (b.returnDate || b.return_date || '').toString().split('T')[0]
        }
      })

      const interests = recentBooksRead.map(b => b.genre).filter((v, i, a) => a.indexOf(v) === i)

      const studentProfile: StudentProfile = {
        id: student.id,
        name: `${student.first_name || student.firstName || ''} ${student.last_name || student.lastName || ''}`.trim(),
        grade: student.grade_name || student.grade?.name || 'Unknown',
        interests: interests.length > 0 ? interests : ['General'],
        readingLevel: 'intermediate',
        recentBooksRead
      }

      const recommendations = await this.generateRecommendations(studentProfile, { books: allBooks }, 5)

      return {
        student: studentProfile,
        recommendations,
        totalRecommendations: recommendations.length,
        analysis: {
          readingLevel: studentProfile.readingLevel,
          preferredCategories: studentProfile.interests,
          readingFrequency: recentBooksRead.length > 5 ? 'High' : recentBooksRead.length > 2 ? 'Medium' : 'Low'
        }
      }
    } catch (error) {
      console.error('Error getting recommendations for student:', error)
      throw error
    }
  }
}

export const libraryRecommendationService = new LibraryRecommendationsService()
