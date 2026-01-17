from django.contrib import admin
from .models import Attendance, AttendanceSummary

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'type', 'marked_by', 'created_at']
    list_filter = ['date', 'type']
    search_fields = ['student__first_name', 'student__last_name', 'notes']
    date_hierarchy = 'date'

@admin.register(AttendanceSummary)
class AttendanceSummaryAdmin(admin.ModelAdmin):
    list_display = ['student', 'month', 'year', 'present_days', 'absent_days', 'attendance_percentage']
    list_filter = ['month', 'year']
    search_fields = ['student__first_name', 'student__last_name']
