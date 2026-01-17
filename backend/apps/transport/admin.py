from django.contrib import admin
from .models import Vehicle, TransportAllocation

@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ['vehicle_number', 'vehicle_type', 'driver_name', 'capacity', 'status']
    list_filter = ['status', 'vehicle_type']
    search_fields = ['vehicle_number', 'driver_name']

@admin.register(TransportAllocation)
class TransportAllocationAdmin(admin.ModelAdmin):
    list_display = ['student', 'vehicle', 'academic_year', 'status']
    list_filter = ['status', 'academic_year']
    search_fields = ['student__first_name', 'student__last_name']
