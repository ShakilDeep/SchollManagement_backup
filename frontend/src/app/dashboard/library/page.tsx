'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
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
  Eye
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

  useEffect(() => {
    fetchBooks()
    fetchBorrowals()
  }, [])

  const fetchBooks = async () => {
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
  }

  const fetchBorrowals = async () => {
    try {
      const response = await fetch('/api/library/borrowals')
      const data = await response.json()
      setBorrowals(data)
    } catch (error) {
      console.error('Error fetching borrowals:', error)
    }
  }

  const calculateStats = (booksData: Book[]) => {
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
  }

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || book.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getAvailabilityBadge = (book: Book) => {
    if (book.availableCopies === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (book.availableCopies < 2) {
      return <Badge variant="secondary">Low Stock</Badge>
    }
    return <Badge variant="default">Available</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      'Borrowed': 'default',
      'Returned': 'secondary',
      'Overdue': 'destructive'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const handleViewDetails = (book: Book) => {
    setSelectedBook(book)
    setIsViewDetailsOpen(true)
  }

  const handleEditBook = (book: Book) => {
    setSelectedBook(book)
    setIsEditBookOpen(true)
  }

  const handleDeleteBook = (book: Book) => {
    setSelectedBook(book)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteBook = async () => {
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
  }

  const availablePercentage = stats.totalBooks > 0 
    ? Math.round((stats.availableBooks / stats.totalBooks) * 100) 
    : 0

  const overduePercentage = stats.borrowed > 0 
    ? Math.round((stats.overdue / stats.borrowed) * 100) 
    : 0

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
          <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <Plus className="mr-2 h-4 w-4" />
                Add Book
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogDescription>
                  Enter the book details to add it to the library
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Book Title *</Label>
                  <Input id="title" placeholder="Enter book title" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Author *</Label>
                    <Input id="author" placeholder="Author name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN *</Label>
                    <Input id="isbn" placeholder="978-0-00-000000-0" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Programming">Programming</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="Literature">Literature</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Geography">Geography</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="copies">Total Copies *</Label>
                    <Input id="copies" type="number" placeholder="Number of copies" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input id="location" placeholder="e.g., Shelf A-1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input id="publisher" placeholder="Publisher name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Publication Year</Label>
                  <Input id="year" type="number" placeholder="2024" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the book" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddBookOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddBookOpen(false)}>
                  Add Book
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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

          <Dialog open={isEditBookOpen} onOpenChange={setIsEditBookOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Book</DialogTitle>
                <DialogDescription>
                  Update the book details
                </DialogDescription>
              </DialogHeader>
              {selectedBook && (
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-title">Book Title</Label>
                    <Input id="edit-title" defaultValue={selectedBook.title} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-author">Author</Label>
                      <Input id="edit-author" defaultValue={selectedBook.author} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-isbn">ISBN</Label>
                      <Input id="edit-isbn" defaultValue={selectedBook.isbn} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-category">Category</Label>
                      <Select defaultValue={selectedBook.category}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Computer Science">Computer Science</SelectItem>
                          <SelectItem value="Programming">Programming</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Literature">Literature</SelectItem>
                          <SelectItem value="History">History</SelectItem>
                          <SelectItem value="Geography">Geography</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-copies">Total Copies</Label>
                      <Input id="edit-copies" type="number" defaultValue={selectedBook.totalCopies} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-location">Location</Label>
                    <Input id="edit-location" defaultValue={selectedBook.location} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditBookOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsEditBookOpen(false)}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
