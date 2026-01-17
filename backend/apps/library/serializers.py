from rest_framework import serializers
from .models import Book, BookIssue

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            'id', 'isbn', 'title', 'author', 'publisher', 'category',
            'publication_year', 'total_copies', 'available_copies',
            'description', 'location', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BookIssueSerializer(serializers.ModelSerializer):
    book_title = serializers.CharField(source='book.title', read_only=True)
    book_isbn = serializers.CharField(source='book.isbn', read_only=True)
    student_name = serializers.CharField(source='student.full_name', read_only=True)

    class Meta:
        model = BookIssue
        fields = [
            'id', 'book', 'book_title', 'book_isbn', 'student', 'student_name',
            'issue_date', 'due_date', 'return_date', 'status', 'fine_amount', 'remarks'
        ]
        read_only_fields = ['id', 'issue_date']
