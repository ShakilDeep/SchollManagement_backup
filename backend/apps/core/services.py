from typing import Optional, List, Dict, Any
from django.db import transaction
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class BaseService:
    def __init__(self, repository):
        self.repository = repository

    def get(self, id: str):
        return self.repository.get_by_id(id)

    def list(self, filters: Optional[Dict[str, Any]] = None):
        queryset = self.repository.filter(**filters) if filters else self.repository.get_all()
        return queryset

    def create(self, data: Dict[str, Any]):
        return self.repository.create(**data)

    def update(self, id: str, data: Dict[str, Any]):
        instance = self.repository.get_by_id(id)
        if not instance:
            raise ValueError(f"{self.repository.model.__name__} with id {id} not found")
        return self.repository.update(instance, **data)

    def delete(self, id: str):
        instance = self.repository.get_by_id(id)
        if not instance:
            raise ValueError(f"{self.repository.model.__name__} with id {id} not found")
        return self.repository.delete(instance)

    def bulk_create(self, data_list: List[Dict[str, Any]]):
        model_class = self.repository.model
        objects = [model_class(**data) for data in data_list]
        return self.repository.bulk_create(objects)


class StudentService(BaseService):
    def get_by_roll_number(self, roll_number: str):
        return self.repository.get_by_roll_number(roll_number)

    def get_by_grade(self, grade_id: str):
        return self.repository.get_by_grade(grade_id)

    def get_active_students(self):
        return self.repository.get_active_students()

    @transaction.atomic
    def promote_student(self, student_id: str, new_grade_id: str):
        student = self.repository.get_by_id(student_id)
        if not student:
            raise ValueError(f"Student with id {student_id} not found")
        student.grade_id = new_grade_id
        student.save()
        logger.info(f"Student {student_id} promoted to grade {new_grade_id}")
        return student


class StaffService(BaseService):
    def get_by_department(self, department: str):
        return self.repository.get_by_department(department)

    def get_active_staff(self):
        return self.repository.get_active_staff()

    def get_by_type(self, staff_type: str):
        return self.repository.get_by_type(staff_type)

    @transaction.atomic
    def deactivate_staff(self, staff_id: str):
        staff = self.repository.get_by_id(staff_id)
        if not staff:
            raise ValueError(f"Staff with id {staff_id} not found")
        staff.is_active = False
        staff.save()
        logger.info(f"Staff {staff_id} deactivated")
        return staff


class AttendanceService(BaseService):
    def get_by_date_range(self, start_date, end_date):
        return self.repository.get_by_date_range(start_date, end_date)

    def get_student_attendance(self, student_id: str, date):
        return self.repository.get_student_attendance(student_id, date)

    def get_monthly_attendance(self, month: int, year: int):
        return self.repository.get_monthly_attendance(month, year)

    @transaction.atomic
    def mark_attendance_bulk(self, attendance_data: List[Dict[str, Any]]):
        from apps.attendance.models import Attendance
        from apps.students.models import Student
        
        results = []
        for data in attendance_data:
            student = Student.objects.get(id=data['student_id'])
            attendance, created = Attendance.objects.update_or_create(
                student=student,
                date=data['date'],
                defaults={
                    'type': data['type'],
                    'notes': data.get('notes', ''),
                    'marked_by': data['marked_by']
                }
            )
            results.append(attendance)
        
        logger.info(f"Bulk attendance marking completed for {len(results)} records")
        return results


class CacheService:
    @staticmethod
    def get(key: str):
        return cache.get(key)

    @staticmethod
    def set(key: str, value, timeout: int = 300):
        return cache.set(key, value, timeout)

    @staticmethod
    def delete(key: str):
        return cache.delete(key)

    @staticmethod
    def delete_pattern(pattern: str):
        from django.core.cache import caches
        cache_backend = caches['default']
        if hasattr(cache_backend, 'delete_pattern'):
            cache_backend.delete_pattern(pattern)
        else:
            from django_redis import get_redis_connection
            r = get_redis_connection('default')
            for key in r.keys(pattern):
                cache.delete(key.decode('utf-8'))

    @staticmethod
    def clear_all():
        return cache.clear()
