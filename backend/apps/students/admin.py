from django.contrib import admin
from .models import AcademicYear, Grade, Section, Parent, Student

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ['name', 'start_date', 'end_date', 'is_current']
    list_filter = ['is_current']
    search_fields = ['name']

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ['name', 'numeric_value', 'order']
    list_filter = ['numeric_value']
    search_fields = ['name']

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ['name', 'grade', 'room_number', 'capacity', 'current_strength']
    list_filter = ['grade']
    search_fields = ['name']

@admin.register(Parent)
class ParentAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'phone', 'email', 'occupation']
    search_fields = ['first_name', 'last_name', 'phone', 'email']

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['roll_number', 'first_name', 'last_name', 'grade', 'section', 'status']
    list_filter = ['grade', 'section', 'status', 'gender']
    search_fields = ['first_name', 'last_name', 'roll_number', 'admission_number']
    ordering = ['first_name', 'last_name']
