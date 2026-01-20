import { fetchAPI } from '@/lib/api/client';

interface BorrowHistory {
  bookId: string;
  title: string;
  author: string;
  category: string;
  borrowDate: Date;
  returnDate: Date | null;
  status: string;
}

interface CategoryPreference {
  category: string;
  count: number;
  avgRating: number;
}

interface BookMatch {
  bookId: string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  availableCopies: number;
  matchScore: number;
  matchReason: string;
}

interface RecommendationResult {
  studentId: string;
  recommendations: BookMatch[];
  readingProfile: {
    totalBooksBorrowed: number;
    topCategories: CategoryPreference[];
    readingFrequency: 'high' | 'medium' | 'low';
    avgReturnDays: number;
  };
  confidence: number;
}

export class BookRecommendationService {
  async analyzeBorrowHistory(studentId: string): Promise<BorrowHistory[]> {
    try {
      const response = await fetchAPI<{ results: any[] }>(`/library/borrowals/?student=${studentId}`)
      const borrowals = response.results || []

      return borrowals.slice(0, 50).map((borrowal: any) => ({
        bookId: borrowal.book || borrowal.bookId,
        title: borrowal.book_title || borrowal.book?.title || 'Unknown',
        author: borrowal.book_author || borrowal.book?.author || 'Unknown',
        category: borrowal.book_category || borrowal.book?.category || 'General',
        borrowDate: new Date(borrowal.borrow_date || borrowal.borrowDate),
        returnDate: borrowal.return_date ? new Date(borrowal.return_date) : null,
        status: borrowal.status || 'Borrowed'
      }))
    } catch (error) {
      console.error('Error analyzing borrow history from backend API:', error)
      return []
    }
  }

  calculateCategoryPreferences(history: BorrowHistory[]): CategoryPreference[] {
    const categoryMap = new Map<string, { count: number; totalRating: number }>();

    history.forEach(borrow => {
      if (!categoryMap.has(borrow.category)) {
        categoryMap.set(borrow.category, { count: 0, totalRating: 0 });
      }
      const data = categoryMap.get(borrow.category)!;
      data.count++;
      data.totalRating += borrow.returnDate ? 5 : 3;
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        avgRating: data.totalRating / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  calculateReadingFrequency(history: BorrowHistory[]): 'high' | 'medium' | 'low' {
    const last30Days = history.filter(b => {
      const daysSinceBorrow = Math.floor((Date.now() - new Date(b.borrowDate).getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceBorrow <= 30;
    }).length;

    if (last30Days >= 5) return 'high';
    if (last30Days >= 2) return 'medium';
    return 'low';
  }

  calculateAvgReturnDays(history: BorrowHistory[]): number {
    const returned = history.filter(b => b.returnDate !== null);
    if (returned.length === 0) return 14;

    const totalDays = returned.reduce((sum, b) => {
      const days = Math.floor((new Date(b.returnDate!).getTime() - new Date(b.borrowDate).getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / returned.length);
  }

  async findMatchingBooks(
    preferences: CategoryPreference[],
    borrowedBookIds: string[],
    frequency: 'high' | 'medium' | 'low'
  ): Promise<BookMatch[]> {
    try {
      const response = await fetchAPI<{ results: any[] }>('/library/books/')
      const books = response.results || []

      const preferredCategories = preferences.slice(0, 3).map(p => p.category)

      return books
        .filter((book: any) => {
          const availableCopies = book.available_copies || book.availableCopies || 0
          const category = book.category || 'General'

          return (
            availableCopies > 0 &&
            !borrowedBookIds.includes(book.id) &&
            (preferredCategories.includes(category) || ['Fiction', 'Science', 'History', 'Biography'].includes(category))
          )
        })
        .slice(0, 10)
        .map((book: any) => {
          const category = book.category || 'General'
          const prefIndex = preferences.findIndex(p => p.category === category)
          const categoryScore = prefIndex !== -1 ? (3 - prefIndex) * 30 : 10
          const availableCopies = book.available_copies || book.availableCopies || 0
          const availabilityScore = Math.min(availableCopies * 5, 30)
          const frequencyBonus = frequency === 'high' ? 20 : frequency === 'medium' ? 10 : 0

          let matchReason = ''
          if (prefIndex !== -1) {
            matchReason = `Matches your interest in ${category} books`
          } else if (['Fiction', 'Science', 'History', 'Biography'].includes(category)) {
            matchReason = `Popular ${category} book to explore`
          } else {
            matchReason = `Available ${category} book`
          }

          return {
            bookId: book.id,
            isbn: book.isbn || '',
            title: book.title || 'Unknown',
            author: book.author || 'Unknown',
            category,
            availableCopies,
            matchScore: categoryScore + availabilityScore + frequencyBonus,
            matchReason
          }
        })
        .sort((a, b) => b.matchScore - a.matchScore)
    } catch (error) {
      console.error('Error finding matching books from backend API:', error)
      return []
    }
  }

  calculateConfidence(
    historyLength: number,
    categoryPreferences: CategoryPreference[],
    avgReturnDays: number
  ): number {
    let confidence = 50;

    if (historyLength >= 10) confidence += 20;
    else if (historyLength >= 5) confidence += 10;

    if (categoryPreferences.length >= 3) confidence += 15;
    else if (categoryPreferences.length >= 1) confidence += 8;

    if (avgReturnDays <= 14) confidence += 10;
    else if (avgReturnDays <= 21) confidence += 5;

    return Math.min(confidence, 95);
  }

  async generateRecommendations(studentId: string): Promise<RecommendationResult> {
    const history = await this.analyzeBorrowHistory(studentId);
    const categoryPreferences = this.calculateCategoryPreferences(history);
    const readingFrequency = this.calculateReadingFrequency(history);
    const avgReturnDays = this.calculateAvgReturnDays(history);
    const borrowedBookIds = history.map(h => h.bookId);

    const recommendations = await this.findMatchingBooks(
      categoryPreferences,
      borrowedBookIds,
      readingFrequency
    );

    const confidence = this.calculateConfidence(
      history.length,
      categoryPreferences,
      avgReturnDays
    );

    return {
      studentId,
      recommendations: recommendations.slice(0, 5),
      readingProfile: {
        totalBooksBorrowed: history.length,
        topCategories: categoryPreferences.slice(0, 3),
        readingFrequency,
        avgReturnDays
      },
      confidence
    };
  }
}

export const bookRecommendationService = new BookRecommendationService();
