from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.students.models import AcademicYear, Grade, Section, Parent, Student
from apps.users.models import User
from datetime import datetime, date
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with initial data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Starting database seeding...')

        self.create_users()
        self.create_academic_years()
        self.create_grades()
        self.create_sections()
        self.create_parents()
        self.create_students()

        self.stdout.write(self.style.SUCCESS('Database seeding completed successfully!'))

    def create_users(self):
        self.stdout.write('Creating users...')
        
        users_data = [
            {
                'email': 'admin@educore.com',
                'username': 'admin',
                'password': 'admin123',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'teacher1@educore.com',
                'username': 'teacher1',
                'password': 'teacher123',
                'first_name': 'John',
                'last_name': 'Teacher',
                'role': 'TEACHER',
            },
            {
                'email': 'teacher2@educore.com',
                'username': 'teacher2',
                'password': 'teacher123',
                'first_name': 'Jane',
                'last_name': 'Instructor',
                'role': 'TEACHER',
            },
        ]

        for user_data in users_data:
            if not User.objects.filter(email=user_data['email']).exists():
                user = User.objects.create_user(
                    email=user_data['email'],
                    username=user_data['username'],
                    password=user_data['password'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    role=user_data['role'],
                    is_staff=user_data.get('is_staff', False),
                    is_superuser=user_data.get('is_superuser', False),
                )
                self.stdout.write(f'  Created user: {user.email}')
            else:
                self.stdout.write(f'  User already exists: {user_data["email"]}')

    def create_academic_years(self):
        self.stdout.write('Creating academic years...')
        
        academic_years_data = [
            {
                'name': '2024-2025',
                'start_date': date(2024, 9, 1),
                'end_date': date(2025, 6, 30),
                'is_current': True,
            },
            {
                'name': '2023-2024',
                'start_date': date(2023, 9, 1),
                'end_date': date(2024, 6, 30),
                'is_current': False,
            },
        ]

        for year_data in academic_years_data:
            if not AcademicYear.objects.filter(name=year_data['name']).exists():
                year = AcademicYear.objects.create(
                    name=year_data['name'],
                    start_date=year_data['start_date'],
                    end_date=year_data['end_date'],
                    is_current=year_data['is_current'],
                )
                self.stdout.write(f'  Created academic year: {year.name}')
            else:
                self.stdout.write(f'  Academic year already exists: {year_data["name"]}')

    def create_grades(self):
        self.stdout.write('Creating grades...')
        
        grades_data = [
            {'name': 'Grade 1', 'numeric_value': 1, 'order': 1},
            {'name': 'Grade 2', 'numeric_value': 2, 'order': 2},
            {'name': 'Grade 3', 'numeric_value': 3, 'order': 3},
            {'name': 'Grade 4', 'numeric_value': 4, 'order': 4},
            {'name': 'Grade 5', 'numeric_value': 5, 'order': 5},
            {'name': 'Grade 6', 'numeric_value': 6, 'order': 6},
            {'name': 'Grade 7', 'numeric_value': 7, 'order': 7},
            {'name': 'Grade 8', 'numeric_value': 8, 'order': 8},
            {'name': 'Grade 9', 'numeric_value': 9, 'order': 9},
            {'name': 'Grade 10', 'numeric_value': 10, 'order': 10},
        ]

        for grade_data in grades_data:
            if not Grade.objects.filter(name=grade_data['name']).exists():
                grade = Grade.objects.create(
                    name=grade_data['name'],
                    numeric_value=grade_data['numeric_value'],
                    order=grade_data['order'],
                )
                self.stdout.write(f'  Created grade: {grade.name}')
            else:
                self.stdout.write(f'  Grade already exists: {grade_data["name"]}')

    def create_sections(self):
        self.stdout.write('Creating sections...')
        
        grades = Grade.objects.all()
        
        for grade in grades:
            for section_name in ['A', 'B', 'C']:
                if not Section.objects.filter(name=section_name, grade=grade).exists():
                    section = Section.objects.create(
                        name=section_name,
                        grade=grade,
                        room_number=f'{section_name}{grade.numeric_value}01',
                        capacity=40,
                        current_strength=0,
                    )
                    self.stdout.write(f'  Created section: {section.name} for {grade.name}')
                else:
                    self.stdout.write(f'  Section already exists: {section_name} for {grade.name}')

    def create_parents(self):
        self.stdout.write('Creating parents...')
        
        parents_data = [
            {
                'email': 'parent1@educore.com',
                'username': 'parent1',
                'password': 'parent123',
                'first_name': 'Robert',
                'last_name': 'Johnson',
                'role': 'PARENT',
                'phone': '+1234567890',
                'address': '123 Main St, City',
            },
            {
                'email': 'parent2@educore.com',
                'username': 'parent2',
                'password': 'parent123',
                'first_name': 'Maria',
                'last_name': 'Garcia',
                'role': 'PARENT',
                'phone': '+1234567891',
                'address': '456 Oak Ave, City',
            },
            {
                'email': 'parent3@educore.com',
                'username': 'parent3',
                'password': 'parent123',
                'first_name': 'David',
                'last_name': 'Smith',
                'role': 'PARENT',
                'phone': '+1234567892',
                'address': '789 Pine Rd, City',
            },
            {
                'email': 'parent4@educore.com',
                'username': 'parent4',
                'password': 'parent123',
                'first_name': 'Lisa',
                'last_name': 'Williams',
                'role': 'PARENT',
                'phone': '+1234567893',
                'address': '321 Elm St, City',
            },
            {
                'email': 'parent5@educore.com',
                'username': 'parent5',
                'password': 'parent123',
                'first_name': 'James',
                'last_name': 'Brown',
                'role': 'PARENT',
                'phone': '+1234567894',
                'address': '654 Maple Dr, City',
            },
        ]

        for parent_data in parents_data:
            if not User.objects.filter(email=parent_data['email']).exists():
                user = User.objects.create_user(
                    email=parent_data['email'],
                    username=parent_data['username'],
                    password=parent_data['password'],
                    first_name=parent_data['first_name'],
                    last_name=parent_data['last_name'],
                    role=parent_data['role'],
                )
                parent = Parent.objects.create(
                    user=user,
                    phone=parent_data['phone'],
                    address=parent_data['address'],
                    occupation='Employed',
                )
                self.stdout.write(f'  Created parent: {user.email}')
            else:
                self.stdout.write(f'  Parent already exists: {parent_data["email"]}')

    def create_students(self):
        self.stdout.write('Creating students...')
        
        academic_year = AcademicYear.objects.filter(is_current=True).first()
        if not academic_year:
            academic_year = AcademicYear.objects.first()

        parents = Parent.objects.all()
        grades = Grade.objects.all()
        
        students_data = [
            {
                'roll_number': 'STU001',
                'admission_number': 'ADM001',
                'first_name': 'Michael',
                'last_name': 'Johnson',
                'gender': 'Male',
                'date_of_birth': date(2012, 5, 15),
                'phone': '+1234567890',
                'email': 'michael.johnson@educore.com',
                'emergency_contact': 'Robert Johnson',
                'emergency_phone': '+1234567890',
                'address': '123 Main St, City',
                'city': 'New York',
                'state': 'NY',
                'zip_code': '10001',
                'grade_index': 0,
                'section_index': 0,
                'parent_index': 0,
                'relationship': 'Father',
            },
            {
                'roll_number': 'STU002',
                'admission_number': 'ADM002',
                'first_name': 'Sarah',
                'last_name': 'Garcia',
                'gender': 'Female',
                'date_of_birth': date(2012, 8, 22),
                'phone': '+1234567891',
                'email': 'sarah.garcia@educore.com',
                'emergency_contact': 'Maria Garcia',
                'emergency_phone': '+1234567891',
                'address': '456 Oak Ave, City',
                'city': 'Los Angeles',
                'state': 'CA',
                'zip_code': '90001',
                'grade_index': 0,
                'section_index': 1,
                'parent_index': 1,
                'relationship': 'Mother',
            },
            {
                'roll_number': 'STU003',
                'admission_number': 'ADM003',
                'first_name': 'Emily',
                'last_name': 'Smith',
                'gender': 'Female',
                'date_of_birth': date(2013, 2, 10),
                'phone': '+1234567892',
                'email': 'emily.smith@educore.com',
                'emergency_contact': 'David Smith',
                'emergency_phone': '+1234567892',
                'address': '789 Pine Rd, City',
                'city': 'Chicago',
                'state': 'IL',
                'zip_code': '60601',
                'grade_index': 1,
                'section_index': 0,
                'parent_index': 2,
                'relationship': 'Father',
            },
            {
                'roll_number': 'STU004',
                'admission_number': 'ADM004',
                'first_name': 'James',
                'last_name': 'Williams',
                'gender': 'Male',
                'date_of_birth': date(2013, 11, 5),
                'phone': '+1234567893',
                'email': 'james.williams@educore.com',
                'emergency_contact': 'Lisa Williams',
                'emergency_phone': '+1234567893',
                'address': '321 Elm St, City',
                'city': 'Houston',
                'state': 'TX',
                'zip_code': '77001',
                'grade_index': 1,
                'section_index': 1,
                'parent_index': 3,
                'relationship': 'Mother',
            },
            {
                'roll_number': 'STU005',
                'admission_number': 'ADM005',
                'first_name': 'Sophia',
                'last_name': 'Brown',
                'gender': 'Female',
                'date_of_birth': date(2014, 4, 18),
                'phone': '+1234567894',
                'email': 'sophia.brown@educore.com',
                'emergency_contact': 'James Brown',
                'emergency_phone': '+1234567894',
                'address': '654 Maple Dr, City',
                'city': 'Phoenix',
                'state': 'AZ',
                'zip_code': '85001',
                'grade_index': 2,
                'section_index': 0,
                'parent_index': 4,
                'relationship': 'Father',
            },
        ]

        for student_data in students_data:
            if not Student.objects.filter(roll_number=student_data['roll_number']).exists():
                grade = grades[student_data['grade_index']]
                sections = Section.objects.filter(grade=grade)
                section = sections[student_data['section_index']]
                parent = parents[student_data['parent_index']]
                
                user = User.objects.create_user(
                    email=student_data['email'],
                    username=student_data['roll_number'],
                    password='student123',
                    first_name=student_data['first_name'],
                    last_name=student_data['last_name'],
                    role='STUDENT',
                )
                
                student = Student.objects.create(
                    user=user,
                    roll_number=student_data['roll_number'],
                    admission_number=student_data['admission_number'],
                    admission_date=timezone.now().date(),
                    first_name=student_data['first_name'],
                    last_name=student_data['last_name'],
                    gender=student_data['gender'],
                    date_of_birth=student_data['date_of_birth'],
                    phone=student_data['phone'],
                    email=student_data['email'],
                    emergency_contact=student_data['emergency_contact'],
                    emergency_phone=student_data['emergency_phone'],
                    address=student_data['address'],
                    city=student_data['city'],
                    state=student_data['state'],
                    zip_code=student_data['zip_code'],
                    grade=grade,
                    section=section,
                    academic_year=academic_year,
                    guardian=parent,
                    relationship=student_data['relationship'],
                    nationality='Local',
                    status='Active',
                )
                self.stdout.write(f'  Created student: {student.roll_number} - {student.first_name} {student.last_name}')
            else:
                self.stdout.write(f'  Student already exists: {student_data["roll_number"]}')
