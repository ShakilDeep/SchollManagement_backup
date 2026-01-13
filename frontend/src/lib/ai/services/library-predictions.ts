import { GeminiClient } from '../gemini-client'
import { LibraryPrediction } from '../types'

export interface LibraryData {
  books: Array<{
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
    createdAt: string
  }>
  borrowals: Array<{
    id: string
    bookId: string
    studentId: string
    borrowDate: string
    dueDate: string
    returnDate?: string
    status: 'Borrowed' | 'Returned' | 'Overdue'
    fine: number
  }>
}

export class LibraryPredictionService {
  private client: GeminiClient

  constructor() {
    this.client = new GeminiClient('gemini-2.0-flash', {
      temperature: 0.4,
      maxOutputTokens: 4096
    })
  }

  async predictLibrary(data: LibraryData): Promise<LibraryPrediction> {
    const categorySummary = this.getCategorySummary(data.books)
    const stockSummary = this.getStockSummary(data.books)
    const borrowalSummary = this.getBorrowalSummary(data.borrowals)
    const popularBooks = this.getPopularBooks(data.books, data.borrowals)

    const prompt = `
      You are an expert library manager and educational resource specialist. Analyze the following library data:

      LIBRARY OVERVIEW:
      - Total Books: ${data.books.length}
      - Total Copies: ${data.books.reduce((sum, b) => sum + b.totalCopies, 0)}
      - Available Copies: ${data.books.reduce((sum, b) => sum + b.availableCopies, 0)}
      - Total Borrowals: ${data.borrowals.length}
      - Overdue Books: ${data.borrowals.filter(b => b.status === 'Overdue').length}

      CATEGORY BREAKDOWN:
      ${Object.entries(categorySummary).map(([category, summary]) => 
        `- ${category}: ${summary.totalBooks} titles, ${summary.totalCopies} copies, ${summary.borrowCount} borrows, ${summary.borrowRate.toFixed(1)}% borrow rate`
      ).join('\n')}

      STOCK ANALYSIS:
      - Out of Stock: ${stockSummary.outOfStock} books
      - Low Stock (< 2 copies): ${stockSummary.lowStock} books
      - Healthy Stock: ${stockSummary.healthyStock} books

      POPULAR BOOKS (Top 10):
      ${popularBooks.slice(0, 10).map(book => 
        `- "${book.title}" by ${book.author} (${book.category}): ${book.borrowCount} borrows, ${book.availableCopies}/${book.totalCopies} available`
      ).join('\n')}

      BORROWAL PATTERNS:
      - Average Loan Duration: ${borrowalSummary.averageLoanDuration.toFixed(1)} days
      - Average Return Delay: ${borrowalSummary.averageReturnDelay.toFixed(1)} days
      - Overdue Rate: ${borrowalSummary.overdueRate.toFixed(1)}%

      RECENT BORROWALS (Last 10):
      ${data.borrowals.slice(-10).reverse().map(b => 
        `- ${b.status}: Book ID ${b.bookId} on ${new Date(b.borrowDate).toLocaleDateString()}`
      ).join('\n')}

      Based on this data, provide comprehensive library predictions including:
      1. Overall health score and status (considering stock levels, overdue rates, and collection quality)
      2. Popular books analysis with trending books and high-demand categories
      3. Stock alerts for out-of-stock and low-stock books with reorder recommendations
      4. Borrowing patterns analysis including peak times, overdue trends, and frequent borrowers
      5. Acquisition recommendations with suggested purchases and categories to expand
      6. Category performance analysis identifying top and underperforming categories
      7. Space utilization recommendations for shelf organization
      8. Actionable alerts with priorities
      9. Key insights, opportunities, and prioritized action items

      IMPORTANT: Use actual book titles, authors, and ISBNs from the data provided. Make realistic estimates for costs, borrowing patterns, and recommendations based on the data.

      Respond in JSON format following the LibraryPrediction interface.
    `

    const result = await this.client.generateJSON<LibraryPrediction>(prompt)

    if (!result.success) {
      throw new Error(result.error || 'Failed to generate library predictions')
    }

    return {
      ...result.data,
      generatedAt: new Date()
    }
  }

  private getCategorySummary(books: LibraryData['books'], borrowals: LibraryData['borrowals']) {
    const summary: Record<string, { totalBooks: number; totalCopies: number; borrowCount: number; borrowRate: number }> = {}
    
    if (!books || books.length === 0) {
      return summary
    }

    books.forEach(book => {
      if (!summary[book.category]) {
        summary[book.category] = { totalBooks: 0, totalCopies: 0, borrowCount: 0, borrowRate: 0 }
      }
      summary[book.category].totalBooks++
      summary[book.category].totalCopies += book.totalCopies
    })

    if (borrowals && borrowals.length > 0) {
      borrowals.forEach(borrowal => {
        const book = books.find(b => b.id === borrowal.bookId)
        if (book && summary[book.category]) {
          summary[book.category].borrowCount++
        }
      })
    }

    Object.values(summary).forEach(cat => {
      cat.borrowRate = cat.totalCopies > 0 ? (cat.borrowCount / cat.totalCopies) * 100 : 0
    })

    return summary
  }

  private getStockSummary(books: LibraryData['books']) {
    let outOfStock = 0
    let lowStock = 0
    let healthyStock = 0

    if (!books || books.length === 0) {
      return { outOfStock, lowStock, healthyStock }
    }

    books.forEach(book => {
      if (book.availableCopies === 0) {
        outOfStock++
      } else if (book.availableCopies < 2) {
        lowStock++
      } else {
        healthyStock++
      }
    })

    return { outOfStock, lowStock, healthyStock }
  }

  private getBorrowalSummary(borrowals: LibraryData['borrowals']) {
    if (!borrowals || borrowals.length === 0) {
      return {
        averageLoanDuration: 0,
        averageReturnDelay: 0,
        overdueRate: 0
      }
    }

    const returnedBorrowals = borrowals.filter(b => b.returnDate)
    
    const loanDurations = returnedBorrowals.map(b => {
      const borrowDate = new Date(b.borrowDate)
      const returnDate = new Date(b.returnDate!)
      return (returnDate.getTime() - borrowDate.getTime()) / (1000 * 60 * 60 * 24)
    })

    const returnDelays = borrowals
      .filter(b => b.returnDate && b.dueDate)
      .map(b => {
        const dueDate = new Date(b.dueDate)
        const returnDate = new Date(b.returnDate!)
        const delayDays = (returnDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        return Math.max(0, delayDays)
      })

    const overdueCount = borrowals.filter(b => b.status === 'Overdue').length

    return {
      averageLoanDuration: loanDurations.length > 0 ? loanDurations.reduce((sum, d) => sum + d, 0) / loanDurations.length : 0,
      averageReturnDelay: returnDelays.length > 0 ? returnDelays.reduce((sum, d) => sum + d, 0) / returnDelays.length : 0,
      overdueRate: borrowals.length > 0 ? (overdueCount / borrowals.length) * 100 : 0
    }
  }

  private getPopularBooks(books: LibraryData['books'], borrowals: LibraryData['borrowals']) {
    const borrowCountByBook = new Map<string, number>()
    
    if (!borrowals || borrowals.length === 0) {
      return []
    }

    borrowals.forEach(borrowal => {
      borrowCountByBook.set(borrowal.bookId, (borrowCountByBook.get(borrowal.bookId) || 0) + 1)
    })

    if (!books || books.length === 0) {
      return []
    }

    return books
      .map(book => ({
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        category: book.category,
        borrowCount: borrowCountByBook.get(book.id) || 0,
        availableCopies: book.availableCopies,
        totalCopies: book.totalCopies
      }))
      .sort((a, b) => b.borrowCount - a.borrowCount)
  }
}

export const libraryPredictionService = new LibraryPredictionService()
