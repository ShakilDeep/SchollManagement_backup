from django.contrib import admin
from .models import Exam, Result

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ['name', 'exam_type', 'grade', 'start_date', 'end_date']
    list_filter = ['exam_type', 'grade', 'academic_year']
    search_fields = ['name']
    date_hierarchy = 'start_date'

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'exam', 'subject', 'marks_obtained', 'total_marks', 'grade']
    list_filter = ['exam', 'subject']
    search_fields = ['student__first_name', 'student__last_name', 'subject']
