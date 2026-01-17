from django.contrib import admin
from .models import Subject, Curriculum

@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'icon']
    search_fields = ['name', 'code']

@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ['grade', 'subject']
    list_filter = ['grade']
