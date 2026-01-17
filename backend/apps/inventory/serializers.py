from rest_framework import serializers
from .models import Category, Item, InventoryTransaction

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'description', 'category', 'category_name',
            'unit', 'unit_price', 'quantity', 'minimum_quantity', 'location',
            'supplier', 'created_at', 'updated_at', 'is_low_stock'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_low_stock(self, obj):
        return obj.quantity <= obj.minimum_quantity

class InventoryTransactionSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            'id', 'item', 'item_name', 'item_code', 'transaction_type',
            'quantity', 'unit_price', 'total_value', 'reference',
            'notes', 'performed_by', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
