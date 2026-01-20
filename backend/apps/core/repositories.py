from django.db import models
from django.core.cache import cache
from typing import TypeVar, Generic, Type, Optional, List, Dict, Any
import hashlib

T = TypeVar('T', bound=models.Model)


class BaseRepository(Generic[T]):
    model: Type[T]

    def __init__(self, model: Type[T]):
        self.model = model

    def get_by_id(self, id: str, use_cache: bool = True) -> Optional[T]:
        cache_key = f"{self.model.__name__}:{id}"
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached
        try:
            instance = self.model.objects.get(id=id)
            if use_cache:
                cache.set(cache_key, instance, timeout=300)
            return instance
        except self.model.DoesNotExist:
            return None

    def get_all(self, use_cache: bool = True) -> List[T]:
        cache_key = f"{self.model.__name__}:all"
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached
        instances = list(self.model.objects.all())
        if use_cache:
            cache.set(cache_key, instances, timeout=300)
        return instances

    def filter(self, **kwargs) -> models.QuerySet[T]:
        return self.model.objects.filter(**kwargs)

    def create(self, **kwargs) -> T:
        instance = self.model.objects.create(**kwargs)
        self._invalidate_cache(instance.id)
        return instance

    def update(self, instance: T, **kwargs) -> T:
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.save()
        self._invalidate_cache(instance.id)
        return instance

    def delete(self, instance: T) -> bool:
        id = instance.id
        instance.delete()
        self._invalidate_cache(id)
        return True

    def bulk_create(self, objects: List[T]) -> List[T]:
        instances = self.model.objects.bulk_create(objects)
        for instance in instances:
            self._invalidate_cache(instance.id)
        return instances

    def _invalidate_cache(self, id: str):
        cache.delete(f"{self.model.__name__}:{id}")
        cache.delete(f"{self.model.__name__}:all")


class StudentRepository(BaseRepository):
    def get_by_roll_number(self, roll_number: str) -> Optional[T]:
        try:
            return self.model.objects.get(roll_number=roll_number)
        except self.model.DoesNotExist:
            return None

    def get_by_grade(self, grade_id: str) -> List[T]:
        return self.filter(grade_id=grade_id)

    def get_active_students(self) -> List[T]:
        return self.filter(status='active')


class StaffRepository(BaseRepository):
    def get_by_department(self, department: str) -> List[T]:
        return self.filter(department=department)

    def get_active_staff(self) -> List[T]:
        return self.filter(is_active=True)

    def get_by_type(self, staff_type: str) -> List[T]:
        return self.filter(type=staff_type)


class AttendanceRepository(BaseRepository):
    def get_by_date_range(self, start_date, end_date) -> List[T]:
        return self.filter(date__range=[start_date, end_date])

    def get_student_attendance(self, student_id: str, date) -> Optional[T]:
        try:
            return self.model.objects.get(student_id=student_id, date=date)
        except self.model.DoesNotExist:
            return None

    def get_monthly_attendance(self, month: int, year: int) -> List[T]:
        return self.filter(date__month=month, date__year=year)
