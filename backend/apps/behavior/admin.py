from django.contrib import admin
from .models import BehaviorRecord

@admin.register(BehaviorRecord)
class BehaviorRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'title', 'behavior_type', 'severity', 'date', 'is_resolved']
    list_filter = ['behavior_type', 'severity', 'is_resolved']
    search_fields = ['student__first_name', 'student__last_name', 'title']
    date_hierarchy = 'date'
