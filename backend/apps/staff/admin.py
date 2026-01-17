from django.contrib import admin
from .models import Staff

@admin.register(Staff)
class StaffAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'designation', 'department', 'type', 'is_active']
    list_filter = ['type', 'department', 'is_active']
    search_fields = ['first_name', 'last_name', 'email', 'designation']
