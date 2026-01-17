from django.contrib import admin
from .models import Category, Item, InventoryTransaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name']
    search_fields = ['name']

@admin.register(Item)
class ItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'category', 'quantity', 'minimum_quantity', 'unit_price']
    list_filter = ['category']
    search_fields = ['name', 'code']

@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display = ['item', 'transaction_type', 'quantity', 'total_value', 'created_at']
    list_filter = ['transaction_type']
    search_fields = ['item__name', 'reference']
    date_hierarchy = 'created_at'
