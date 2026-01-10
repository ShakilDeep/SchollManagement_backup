'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { AddBookDialog } from './components/add-book-dialog'
import { EditBookDialog } from './components/edit-book-dialog'
import {
  Plus,
  Search,
  MoreVertical,
  BookOpen,
  Users,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Clock,
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Sparkles,
  RefreshCw
} from 'lucide-react'

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

interface Borrowal {
  id: string
  bookTitle: string
  bookIsbn: string
  studentName: string
  studentRollNumber: string
  borrowDate: string
  dueDate: string
  returnDate?: string
  status: 'Borrowed' | 'Returned' | 'Overdue'
  fine: number
}

interface LibraryStats {
  totalBooks: number
  availableBooks: number
  borrowed: number
  overdue: number
  returned: number
  totalValue: number
}

interface BookRecommendation {
  bookId: string
  isbn: string
  title: string
  author: string
  category: string
  availableCopies: number
  matchScore: number
  matchReason: string
}

interface RecommendationResponse {
  student: {
    id: string
    firstName: string
    lastName: string
    grade: string
    section: string
    rollNumber: string
  }
  recommendations: BookRecommendation[]
  totalRecommendations: number
  analysis: {
    readingLevel: string
    preferredCategories: string[]
    readingFrequency: string
  }
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [borrowals, setBorrowals] = useState<Borrowal[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [isAddBookOpen, setIsAddBookOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false)
  const [isEditBookOpen, setIsEditBookOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [stats, setStats] = useState<LibraryStats>({
    totalBooks: 0,
    availableBooks: 0,
    borrowed: 0,
    overdue: 0,
    returned: 0,
    totalValue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [recommendationsLoading, setRecommendationsLoading] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const fetchBooks = useCallback(async () => {
    try {
      const response = await fetch('/api/library/books')
      const data = await response.json()
      setBooks(data)
      calculateStats(data)
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBorrowals = useCallback(async () => {
    try {
      const response = await fetch('/api/library/borrowals')
      const data = await response.json()
      setBorrowals(data)
    } catch (error) {
      console.error('Error fetching borrowals:', error)
    }
  }, [])

  const fetchStudentByRollNumber = useCallback(async (rollNumber: string) => {
    try {
      const response = await fetch(`/api/students?rollNumber=${rollNumber}`)
      if (!response.ok) throw new Error('Student not found')
      const student = await response.json()
      return student.id
    } catch (error) {
      console.error('Error fetching student:', error)
      return null
    }
  }, [])

  const fetchRecommendations = useCallback(async (rollNumber: string) => {
    if (!rollNumber) {
      setRecommendations(null)
      return
    }

    setRecommendationsLoading(true)
    try {
      const studentId = await fetchStudentByRollNumber(rollNumber)
      if (!studentId) {
        setRecommendations(null)
        return
      }

      const response = await fetch(`/api/library/book-recommendations?studentId=${studentId}`)
      if (!response.ok) throw new Error('Failed to fetch recommendations')
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      setRecommendationsLoading(false)
    }
  }, [fetchStudentByRollNumber])

  useEffect(() => {
    fetchBooks()
    fetchBorrowals()
  }, [fetchBooks, fetchBorrowals])

  const calculateStats = useCallback((booksData: Book[]) => {
    const totalBooks = booksData.reduce((acc, b) => acc + b.totalCopies, 0)
    const availableBooks = booksData.reduce((acc, b) => acc + b.availableCopies, 0)
    const borrowed = borrowals.filter(b => b.status === 'Borrowed').length
    const overdue = borrowals.filter(b => b.status === 'Overdue').length
    const returned = borrowals.filter(b => b.status === 'Returned').length
    const totalValue = booksData.length * 25

    setStats({
      totalBooks,
      availableBooks,
      borrowed,
      overdue,
      returned,
      totalValue,
    })
  }, [borrowals])

  const filteredBooks = useMemo(() => books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter
    return matchesSearch && matchesCategory
  }), [books, searchTerm, categoryFilter])

  const getAvailabilityBadge = useCallback((book: Book) => {
    if (book.availableCopies === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (book.availableCopies < 2) {
      return <Badge variant="secondary">Low Stock</Badge>
    }
    return <Badge variant="default">Available</Badge>
  }, [])

  const getStatusBadge = useCallback((status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'Borrowed': 'default',
      'Returned': 'secondary',
      'Overdue': 'destructive'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }, [])

  const handleViewDetails = useCallback((rec: BookRecommendation | Book) => {
    const book: Book = 'bookId' in rec 
      ? {
          id: rec.bookId,
          isbn: rec.isbn,
          title: rec.title,
          author: rec.author,
          category: rec.category,
          totalCopies: rec.availableCopies,
          availableCopies: rec.availableCopies,
          location: 'Library',
        }
      : rec;
    setSelectedBook(book)
    setIsViewDetailsOpen(true)
  }, [])

  const handleEditBook = useCallback((book: Book) => {
    setSelectedBook(book)
    setIsEditBookOpen(true)
  }, [])

  const handleDeleteBook = useCallback((book: Book) => {
    setSelectedBook(book)
    setIsDeleteDialogOpen(true)
  }, [])

  const confirmDeleteBook = useCallback(async () => {
    if (!selectedBook) return
    try {
      const response = await fetch(`/api/library/books/${selectedBook.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchBooks()
        setIsDeleteDialogOpen(false)
        setSelectedBook(null)
      }
    } catch (error) {
      console.error('Error deleting book:', error)
    }
  }, [selectedBook, fetchBooks])

  const availablePercentage = useMemo(() => stats.totalBooks > 0 
    ? Math.round((stats.availableBooks / stats.totalBooks) * 100) 
    : 0, [stats.totalBooks, stats.availableBooks])

  const overduePercentage = useMemo(() => stats.borrowed > 0 
    ? Math.round((stats.overdue / stats.borrowed) * 100) 
    : 0, [stats.borrowed, stats.overdue])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Library Management</h1>
            <p className="text-muted-foreground mt-1">
              Track books, borrowings, and returns
            </p>
          </div>
          <Button className="h-10" onClick={() => setIsAddBookOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
          <AddBookDialog
            open={isAddBookOpen}
            onOpenChange={setIsAddBookOpen}
            onSuccess={fetchBooks}
          />

          <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Book Details</DialogTitle>
              </DialogHeader>
              {selectedBook && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Title</Label>
                    <p className="font-medium text-lg">{selectedBook.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">ISBN</Label>
                      <p className="font-medium">{selectedBook.isbn}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Category</Label>
                      <p className="font-medium">{selectedBook.category}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Author</Label>
                      <p className="font-medium">{selectedBook.author}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Location</Label>
                      <p className="font-medium">{selectedBook.location}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Copies</Label>
                      <p className="font-medium">{selectedBook.totalCopies}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Available</Label>
                      <p className="font-medium">{selectedBook.availableCopies}</p>
                    </div>
                  </div>
                  {selectedBook.publisher && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Publisher</Label>
                      <p className="font-medium">{selectedBook.publisher}</p>
                    </div>
                  )}
                  {selectedBook.publicationYear && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Publication Year</Label>
                      <p className="font-medium">{selectedBook.publicationYear}</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <EditBookDialog
            open={isEditBookOpen}
            onOpenChange={setIsEditBookOpen}
            book={selectedBook}
            onSuccess={fetchBooks}
          />

          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Book</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this book? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              {selectedBook && (
                <div className="py-4">
                  <p className="font-medium">{selectedBook.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedBook.author}</p>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={confirmDeleteBook}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Books</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalBooks}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all categories</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.availableBooks}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{availablePercentage}%</Badge>
                <p className="text-xs text-muted-foreground">Ready for borrowing</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Borrowed</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.borrowed}</div>
              <p className="text-xs text-muted-foreground mt-1">Currently checked out</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="destructive" className="text-xs">{overduePercentage}%</Badge>
                <p className="text-xs text-muted-foreground">Require attention</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">AI-Powered Book Recommendations</CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchRecommendations(selectedStudentId)}
                disabled={!selectedStudentId || recommendationsLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${recommendationsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Get personalized book suggestions based on student reading patterns
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter student roll number to get recommendations..."
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => fetchRecommendations(selectedStudentId)}
                  disabled={!selectedStudentId || recommendationsLoading}
                >
                  {recommendationsLoading ? 'Loading...' : 'Get Recommendations'}
                </Button>
              </div>

              {recommendationsLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Analyzing reading patterns...</p>
                  </div>
                </div>
              )}

              {recommendations && !recommendationsLoading && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-purple-50/50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Books Borrowed</p>
                      <p className="font-semibold text-purple-700">{recommendations.readingProfile.totalBooksBorrowed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reading Frequency</p>
                      <p className="font-semibold text-purple-700 capitalize">{recommendations.readingProfile.readingFrequency}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence Score</p>
                      <p className="font-semibold text-purple-700">{recommendations.confidence}%</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Recommended Books ({recommendations.recommendations.length})
                    </h4>
                    <div className="grid gap-3">
                      {recommendations.recommendations.map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-4 border rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
                          onClick={() => handleViewDetails(rec)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-semibold text-sm">{rec.title}</h5>
                                <Badge variant="outline" className="text-xs">
                                  {rec.matchScore}% Match
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                by {rec.author} • {rec.category}
                              </p>
                              <p className="text-xs text-slate-600">{rec.matchReason}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge
                                variant={rec.availableCopies > 0 ? "default" : "destructive"}
                                className="text-xs"
                              >
                                {rec.availableCopies} Available
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {!recommendations && !recommendationsLoading && selectedStudentId && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Enter a student ID above to get personalized book recommendations
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Books Catalog</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search-books"
                  placeholder="Search by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-slate-300 focus:border-slate-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Select id="filter-category" value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px] h-10 border-slate-300 focus:border-slate-500">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Programming">Programming</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Literature">Literature</SelectItem>
                    <SelectItem value="History">History</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border mt-6">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[180px]">ISBN</TableHead>
                    <TableHead className="w-[300px]">Title</TableHead>
                    <TableHead className="w-[200px]">Author</TableHead>
                    <TableHead className="w-[150px]">Category</TableHead>
                    <TableHead className="w-[100px] text-center">Total</TableHead>
                    <TableHead className="w-[100px] text-center">Available</TableHead>
                    <TableHead className="w-[120px]">Location</TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Loading books...
                      </TableCell>
                    </TableRow>
                  ) : filteredBooks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        No books found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBooks.map((book) => (
                      <TableRow 
                        key={book.id}
                        className={book.availableCopies === 0 ? 'bg-red-50/50' : book.availableCopies < 2 ? 'bg-orange-50/50' : ''}
                      >
                        <TableCell className="font-medium text-xs">{book.isbn}</TableCell>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author}</TableCell>
                        <TableCell><Badge variant="outline">{book.category}</Badge></TableCell>
                        <TableCell className="text-center">{book.totalCopies}</TableCell>
                        <TableCell className="text-center">
                          <span className={`font-semibold ${
                            book.availableCopies === 0 ? 'text-red-600' :
                            book.availableCopies < 2 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {book.availableCopies}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{book.location}</TableCell>
                        <TableCell>{getAvailabilityBadge(book)}</TableCell>
                        <TableCell className="relative overflow-visible z-10">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuPortal>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Book Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 cursor-pointer"
                                  onSelect={() => handleViewDetails(book)}
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 cursor-pointer"
                                  onSelect={() => handleEditBook(book)}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Book
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 text-red-600 cursor-pointer"
                                  onSelect={() => handleDeleteBook(book)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Book
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenuPortal>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Borrowals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="w-[250px]">Book Title</TableHead>
                    <TableHead className="w-[180px]">Student</TableHead>
                    <TableHead className="w-[120px]">Borrowed</TableHead>
                    <TableHead className="w-[120px]">Due</TableHead>
                    <TableHead className="w-[120px]">Returned</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[100px] text-right">Fine</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrowals.slice(0, 10).map((borrowal) => (
                    <TableRow 
                      key={borrowal.id}
                      className={borrowal.status === 'Overdue' ? 'bg-red-50/50' : ''}
                    >
                      <TableCell className="font-medium">{borrowal.bookTitle}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {borrowal.studentName}
                          <div className="text-xs text-muted-foreground">{borrowal.studentRollNumber}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{borrowal.borrowDate}</TableCell>
                      <TableCell className="text-xs">{borrowal.dueDate}</TableCell>
                      <TableCell className="text-xs">{borrowal.returnDate || '-'}</TableCell>
                      <TableCell>{getStatusBadge(borrowal.status)}</TableCell>
                      <TableCell className="text-right">
                        <span className={borrowal.fine > 0 ? 'text-red-600 font-semibold' : ''}>
                          ${borrowal.fine.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
