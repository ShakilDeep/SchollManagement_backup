import { GeminiClient } from '../gemini-client'
import { BookRecommendation } from '../types'

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

interface LibraryInventory {
  books: Array<{
    id: string
    title: string
    author: string
    genre: string
    subgenres: string[]
    difficulty: 'easy' | 'medium' | 'hard'
    pageCount: number
    availability: 'available' | 'borrowed' | 'reserved'
    ageGroup: string[]
    topics: string[]
    awards?: string[]
  }>
}

export class LibraryRecommendationService {
  private client: GeminiClient

  constructor() {
    this.client = new GeminiClient('gemini-1.5-flash', {
      temperature: 0.4,
      maxOutputTokens: 2048
    })
  }

  async generateRecommendations(
    student: StudentProfile,
    library: LibraryInventory,
    count: number = 5
  ): Promise<BookRecommendation[]> {
    const availableBooks = library.books.filter(book => book.availability === 'available')

    const prompt = `
      You are an expert librarian specializing in personalized book recommendations. Analyze the following student profile and library inventory to recommend the best books:

      Student Profile:
      - Name: ${student.name}
      - Grade: ${student.grade}
      - Reading Level: ${student.readingLevel}
      - Interests: ${student.interests.join(', ')}

      ${student.recentBooksRead.length > 0 ? `
      Recently Read Books:
      ${student.recentBooksRead.map(book => 
        `- ${book.title} by ${book.author} (${book.genre}) - Rating: ${book.rating}/5`
      ).join('\n')}
      ` : ''}

      ${student.academicPerformance ? `
      Academic Performance:
      - Average: ${student.academicPerformance.average.toFixed(1)}%
      ${Object.entries(student.academicPerformance.subjects).map(([subject, score]) => 
        `- ${subject}: ${score.toFixed(1)}%`
      ).join('\n')}
      ` : ''}

      Library Inventory (${availableBooks.length} available books):
      ${availableBooks.slice(0, 50).map(book => 
        `- ${book.title} by ${book.author} (${book.genre}) [${book.difficulty}] - Topics: ${book.topics.join(', ')}`
      ).join('\n')}

      Based on this analysis, recommend ${count} books that are:
      1. Aligned with the student's interests and reading level
      2. Not already read by the student
      3. Currently available in the library
      4. Appropriate for their grade level
      5. Complement their academic strengths or address weaknesses

      For each recommendation, include:
      - Relevance score (0-1)
      - Specific reason for recommendation
      - How it relates to student interests
      - Estimated reading time based on reading level

      Respond in JSON format:
      [
        {
          "bookId": string,
          "title": string,
          "author": string,
          "genre": string,
          "relevanceScore": number,
          "reason": string,
          "relatedToStudentInterests": string[],
          "difficulty": "easy" | "medium" | "hard",
          "estimatedReadingTime": string
        }
      ]
    `

    const result = await this.client.generateJSON<BookRecommendation[]>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate book recommendations')
    }

    return result.data
  }

  async generateCurriculumRecommendations(
    student: StudentProfile,
    library: LibraryInventory,
    subject: string
  ): Promise<BookRecommendation[]> {
    const availableBooks = library.books.filter(
      book => book.availability === 'available' && 
      (book.topics.includes(subject.toLowerCase()) || 
       book.genre.toLowerCase().includes(subject.toLowerCase()))
    )

    const prompt = `
      You are an educational curriculum specialist. Recommend books from the library that will help this student improve in ${subject}:

      Student Profile:
      - Name: ${student.name}
      - Grade: ${student.grade}
      - Reading Level: ${student.readingLevel}

      ${student.academicPerformance ? `
      Performance in ${subject}: ${student.academicPerformance.subjects[subject] || 'N/A'}%
      Overall Average: ${student.academicPerformance.average.toFixed(1)}%
      ` : ''}

      Available Books (${availableBooks.length}):
      ${availableBooks.map(book => 
        `- ${book.title} by ${book.author} (${book.genre}) [${book.difficulty}] - Topics: ${book.topics.join(', ')}`
      ).join('\n')}

      Recommend 5 books that will:
      1. Strengthen ${subject} understanding
      2. Be appropriate for their current level
      3. Help them improve academically
      4. Be engaging and interesting

      Respond in JSON format:
      [
        {
          "bookId": string,
          "title": string,
          "author": string,
          "genre": string,
          "relevanceScore": number,
          "reason": string,
          "relatedToStudentInterests": string[],
          "difficulty": "easy" | "medium" | "hard",
          "estimatedReadingTime": string
        }
      ]
    `

    const result = await this.client.generateJSON<BookRecommendation[]>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate curriculum recommendations')
    }

    return result.data
  }
}

export const libraryRecommendationService = new LibraryRecommendationService()
