from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Book, BookIssue
from .serializers import BookSerializer, BookIssueSerializer

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category']
    search_fields = ['title', 'author', 'isbn']
    ordering_fields = ['title', 'publication_year']
    ordering = ['title']

    @action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        book = self.get_object()
        if book.available_copies <= 0:
            return Response({'error': 'No copies available'}, status=status.HTTP_400_BAD_REQUEST)
        
        student_id = request.data.get('student_id')
        due_date = request.data.get('due_date')
        
        if not all([student_id, due_date]):
            return Response({'error': 'student_id and due_date are required'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.students.models import Student
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            return Response({'error': 'Student not found'}, status=status.HTTP_404_NOT_FOUND)

        BookIssue.objects.create(book=book, student=student, due_date=due_date)
        book.available_copies -= 1
        book.save()

        return Response({'message': 'Book issued successfully'})

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        book = self.get_object()
        issue_id = request.data.get('issue_id')
        
        try:
            issue = BookIssue.objects.get(id=issue_id, book=book)
        except BookIssue.DoesNotExist:
            return Response({'error': 'Issue record not found'}, status=status.HTTP_404_NOT_FOUND)

        issue.return_date = request.data.get('return_date')
        issue.status = 'RETURNED'
        issue.save()

        book.available_copies += 1
        book.save()

        return Response({'message': 'Book returned successfully'})

class BookIssueViewSet(viewsets.ModelViewSet):
    queryset = BookIssue.objects.select_related('book', 'student').all()
    serializer_class = BookIssueSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['student', 'book', 'status']
    search_fields = ['student__first_name', 'student__last_name', 'book__title']
    ordering_fields = ['issue_date', 'due_date']
    ordering = ['-issue_date']
