import { z } from 'zod'

export const bookSchema = z.object({
  title: z.string().min(1, 'Title is required').min(3, 'Title must be at least 3 characters'),
  author: z.string().min(1, 'Author is required').min(2, 'Author name must be at least 2 characters'),
  isbn: z.string()
    .min(1, 'ISBN is required')
    .regex(/^(?:\d{9}[\dXx]|\d{13})$/, 'Invalid ISBN format (10 or 13 digits)'),
  category: z.enum(['Fiction', 'Non-Fiction', 'Science', 'Technology', 'History', 'Biography', 'Children', 'Reference', 'Other'], {
    required_error: 'Category is required',
    invalid_type_error: 'Please select a valid category'
  }),
  totalCopies: z.number({
    required_error: 'Total copies is required',
    invalid_type_error: 'Total copies must be a number'
  }).min(1, 'Must have at least 1 copy').max(1000, 'Cannot exceed 1000 copies'),
  availableCopies: z.number({
    invalid_type_error: 'Available copies must be a number'
  }).min(0, 'Available copies cannot be negative').optional(),
  location: z.string().min(1, 'Location is required').min(2, 'Location must be at least 2 characters'),
  publisher: z.string().min(1, 'Publisher is required').min(2, 'Publisher name must be at least 2 characters'),
  publicationYear: z.number({
    required_error: 'Publication year is required',
    invalid_type_error: 'Publication year must be a number'
  }).min(1800, 'Publication year must be after 1800')
    .max(new Date().getFullYear() + 1, 'Publication year cannot be in the future'),
  description: z.string().optional()
})

export type BookInput = z.infer<typeof bookSchema>
