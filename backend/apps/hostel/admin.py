from django.contrib import admin
from .models import Hostel, Room, HostelAllocation

@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'location', 'capacity', 'warden_name', 'status']
    list_filter = ['status']
    search_fields = ['name', 'code', 'warden_name']

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['hostel', 'room_number', 'floor', 'capacity', 'current_occupancy']
    list_filter = ['hostel', 'floor']
    search_fields = ['room_number']

@admin.register(HostelAllocation)
class HostelAllocationAdmin(admin.ModelAdmin):
    list_display = ['student', 'room', 'academic_year', 'status']
    list_filter = ['status', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name']
