# Database Design (SQLite + Django ORM)

## 5.3 Database Design (StudentFlow)

### 5.3.1 Django ORM Overview

The StudentFlow database uses SQLite with Django ORM for robust database access. The schema is designed for scalability, performance, and data integrity while maintaining simplicity for development and deployment.

### 5.3.2 Core Models (Django Models)

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(max_length=20, choices=[
        ('SUPER_ADMIN', 'Super Admin'),
        ('SCHOOL_ADMIN', 'School Admin'),
        ('TEACHER', 'Teacher'),
        ('STUDENT', 'Student'),
        ('PARENT', 'Parent'),
    ], default='STUDENT')
    is_active = models.BooleanField(default=True)
    email_verified = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=[
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ], null=True, blank=True)
    address = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    admission_number = models.CharField(max_length=50, unique=True)
    admission_date = models.DateField()
    roll_number = models.CharField(max_length=20, null=True, blank=True)
    blood_group = models.CharField(max_length=10, null=True, blank=True)
    previous_school = models.CharField(max_length=200, null=True, blank=True)
    medical_info = models.JSONField(null=True, blank=True)
    emergency_contact = models.JSONField(null=True, blank=True)
    documents = models.JSONField(null=True, blank=True)  # File URLs for certificates, etc.
    is_active = models.BooleanField(default=True)
    graduated_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.admission_number})"

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    joining_date = models.DateField()
    designation = models.CharField(max_length=100)
    qualification = models.JSONField(null=True, blank=True)
    experience = models.JSONField(null=True, blank=True)  # Years of experience, previous institutions
    specialization = models.CharField(max_length=100, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    social_links = models.JSONField(null=True, blank=True)  # LinkedIn, academic profiles
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.employee_id})"

class Parent(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='parent_profile')
    occupation = models.CharField(max_length=100, null=True, blank=True)
    workplace = models.CharField(max_length=200, null=True, blank=True)
    income_range = models.CharField(max_length=50, null=True, blank=True)
    education = models.CharField(max_length=100, null=True, blank=True)
    relationship = models.CharField(max_length=20, null=True, blank=True)  # Father, Mother, Guardian, etc.
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} (Parent)"

class Admin(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='admin_profile')
    employee_id = models.CharField(max_length=50, unique=True)
    joining_date = models.DateField()
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)
    access_level = models.CharField(max_length=20, choices=[
        ('FULL', 'Full Access'),
        ('PARTIAL', 'Partial Access'),
        ('READ_ONLY', 'Read Only'),
    ], default='PARTIAL')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.first_name} {self.user.last_name} ({self.employee_id})"
```

### 5.3.3 Academic Management Models

```python
# apps/academics/models.py
from django.db import models
from django.conf import settings

class AcademicYear(models.Model):
    name = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Class(models.Model):
    name = models.CharField(max_length=50)  # e.g., "Grade 10", "Class 9A"
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    description = models.TextField(null=True, blank=True)
    capacity = models.PositiveIntegerField(default=40)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.academic_year.name})"

class Section(models.Model):
    class_model = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='sections')
    name = models.CharField(max_length=20)  # e.g., "A", "B", "C"
    room_number = models.CharField(max_length=20, null=True, blank=True)
    capacity = models.PositiveIntegerField(default=35)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.class_model.name} - Section {self.name}"

class Subject(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)
    credit_hours = models.PositiveIntegerField(default=1)
    is_core = models.BooleanField(default=False)  # Core subject or elective
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Enrollment(models.Model):
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    class_model = models.ForeignKey(Class, on_delete=models.CASCADE, related_name='enrollments')
    section = models.ForeignKey(Section, on_delete=models.CASCADE, null=True, blank=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    enrollment_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'class_model', 'academic_year']

    def __str__(self):
        return f"{self.student.user.first_name} - {self.class_model.name}"

class ClassTeacherAssignment(models.Model):
    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE)
    class_model = models.ForeignKey(Class, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, null=True, blank=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    assigned_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['teacher', 'class_model', 'academic_year']

    def __str__(self):
        return f"{self.teacher.user.first_name} - {self.class_model.name}"

class SubjectAssignment(models.Model):
    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    class_model = models.ForeignKey(Class, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, null=True, blank=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    assigned_date = models.DateField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['teacher', 'subject', 'class_model', 'academic_year']

    def __str__(self):
        return f"{self.teacher.user.first_name} - {self.subject.name} - {self.class_model.name}"

class ParentStudent(models.Model):
    parent = models.ForeignKey('users.Parent', on_delete=models.CASCADE, related_name='student_relationships')
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE, related_name='parent_relationships')
    relationship = models.CharField(max_length=20, choices=[
        ('FATHER', 'Father'),
        ('MOTHER', 'Mother'),
        ('GUARDIAN', 'Guardian'),
    ])
    is_primary_contact = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['parent', 'student']

    def __str__(self):
        return f"{self.parent.user.first_name} - {self.student.user.first_name} ({self.relationship})"

class TimetableEntry(models.Model):
    class_model = models.ForeignKey(Class, on_delete=models.CASCADE)
    section = models.ForeignKey(Section, on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE)
    day_of_week = models.IntegerField(choices=[(i, i) for i in range(1, 8)])  # 1-7 (Monday to Sunday)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=20, null=True, blank=True)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.class_model.name} - {self.subject.name} ({self.get_day_of_week_display()})"
```

### 5.3.4 Attendance Models

```python
# apps/attendance/models.py
from django.db import models
from django.utils import timezone

class Attendance(models.Model):
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    class_model = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE, null=True, blank=True)
    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE)
    date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('LATE', 'Late'),
        ('EXCUSED', 'Excused'),
        ('LEAVE', 'Leave'),
    ], default='PRESENT')
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    marked_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='marked_attendance')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'class_model', 'date']

    def __str__(self):
        return f"{self.student.user.first_name} - {self.status} ({self.date})"

class AttendanceSummary(models.Model):
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    class_model = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE)
    month = models.IntegerField()
    year = models.IntegerField()
    total_days = models.PositiveIntegerField(default=0)
    present_days = models.PositiveIntegerField(default=0)
    absent_days = models.PositiveIntegerField(default=0)
    late_days = models.PositiveIntegerField(default=0)
    leave_days = models.PositiveIntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'class_model', 'month', 'year']

    def __str__(self):
        return f"{self.student.user.first_name} - {self.month}/{self.year} ({self.percentage}%)"
```

### 5.3.5 Examination Models

```python
# apps/examinations/models.py
from django.db import models

class Exam(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    exam_type = models.CharField(max_length=20, choices=[
        ('MID_TERM', 'Mid Term'),
        ('FINAL', 'Final'),
        ('UNIT_TEST', 'Unit Test'),
        ('QUIZ', 'Quiz'),
        ('ASSIGNMENT', 'Assignment'),
    ])
    max_marks = models.DecimalField(max_digits=6, decimal_places=2)
    pass_marks = models.DecimalField(max_digits=6, decimal_places=2)
    duration_minutes = models.PositiveIntegerField()
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE)
    created_by = models.ForeignKey('users.Teacher', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.exam_type})"

class ExamSchedule(models.Model):
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    class_model = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room_number = models.CharField(max_length=20, null=True, blank=True)
    invigilator = models.ForeignKey('users.Teacher', on_delete=models.CASCADE, related_name='invigilated_exams')
    instructions = models.TextField(null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.exam.name} - {self.class_model.name} ({self.date})"

class Grade(models.Model):
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    exam_schedule = models.ForeignKey(ExamSchedule, on_delete=models.CASCADE)
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2)
    grade = models.CharField(max_length=5, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    graded_by = models.ForeignKey('users.Teacher', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['student', 'exam_schedule']

    def __str__(self):
        return f"{self.student.user.first_name} - {self.exam_schedule.exam.name} ({self.marks_obtained})"
```

### 5.3.6 Assignment Models

```python
# apps/assignments/models.py
from django.db import models

class Assignment(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    subject = models.ForeignKey('academics.Subject', on_delete=models.CASCADE)
    class_model = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    teacher = models.ForeignKey('users.Teacher', on_delete=models.CASCADE)
    assigned_date = models.DateField()
    due_date = models.DateField()
    max_marks = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    attachment = models.FileField(upload_to='assignments/', null=True, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.class_model.name}"

class AssignmentSubmission(models.Model):
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    submission_date = models.DateTimeField(auto_now_add=True)
    file_attachment = models.FileField(upload_to='submissions/', null=True, blank=True)
    text_content = models.TextField(null=True, blank=True)
    marks_obtained = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    is_graded = models.BooleanField(default=False)
    graded_by = models.ForeignKey('users.Teacher', on_delete=models.CASCADE, null=True, blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['assignment', 'student']

    def __str__(self):
        return f"{self.student.user.first_name} - {self.assignment.title}"
```

### 5.3.7 Fee Management Models

```python
# apps/fees/models.py
from django.db import models

class FeeStructure(models.Model):
    class_model = models.ForeignKey('academics.Class', on_delete=models.CASCADE)
    academic_year = models.ForeignKey('academics.AcademicYear', on_delete=models.CASCADE)
    fee_type = models.CharField(max_length=50, choices=[
        ('TUITION', 'Tuition Fee'),
        ('TRANSPORT', 'Transport Fee'),
        ('LAB', 'Lab Fee'),
        ('LIBRARY', 'Library Fee'),
        ('EXAM', 'Examination Fee'),
        ('HOSTEL', 'Hostel Fee'),
        ('OTHER', 'Other Fee'),
    ])
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    due_date = models.DateField()
    is_mandatory = models.BooleanField(default=True)
    frequency = models.CharField(max_length=20, choices=[
        ('ONE_TIME', 'One Time'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    ], default='ONE_TIME')
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    late_fee_days = models.PositiveIntegerField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['class_model', 'academic_year', 'fee_type']

    def __str__(self):
        return f"{self.name} - {self.class_model.name}"

class FeePayment(models.Model):
    student = models.ForeignKey('users.Student', on_delete=models.CASCADE)
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(auto_now_add=True)
    payment_method = models.CharField(max_length=20, choices=[
        ('CASH', 'Cash'),
        ('CHEQUE', 'Cheque'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('ONLINE', 'Online Payment'),
        ('CARD', 'Credit/Debit Card'),
    ])
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    receipt_number = models.CharField(max_length=50, unique=True)
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=[
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ], default='COMPLETED')
    parent = models.ForeignKey('users.Parent', on_delete=models.CASCADE, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.user.first_name} - {self.fee_structure.name} ({self.amount_paid})"
```

### 5.3.8 Communication Models

```python
# apps/communications/models.py
from django.db import models

class Announcement(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    sender = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='created_announcements')
    target_audience = models.CharField(max_length=20, choices=[
        ('ALL', 'All Users'),
        ('STUDENTS', 'Students Only'),
        ('TEACHERS', 'Teachers Only'),
        ('PARENTS', 'Parents Only'),
        ('ADMIN', 'Admin Only'),
        ('CLASS', 'Specific Class'),
        ('SECTION', 'Specific Section'),
    ], default='ALL')
    class_model = models.ForeignKey('academics.Class', on_delete=models.CASCADE, null=True, blank=True)
    section = models.ForeignKey('academics.Section', on_delete=models.CASCADE, null=True, blank=True)
    priority = models.CharField(max_length=10, choices=[
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ], default='MEDIUM')
    attachment = models.FileField(upload_to='announcements/', null=True, blank=True)
    is_published = models.BooleanField(default=True)
    publish_date = models.DateTimeField(auto_now_add=True)
    expiry_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.publish_date.date()})"

class Message(models.Model):
    sender = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=200)
    body = models.TextField()
    attachments = models.JSONField(null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    parent_message = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    message_type = models.CharField(max_length=20, choices=[
        ('DIRECT', 'Direct Message'),
        ('ANNOUNCEMENT', 'Announcement'),
        ('SYSTEM', 'System Notification'),
        ('URGENT', 'Urgent Message'),
    ], default='DIRECT')
    priority = models.CharField(max_length=10, choices=[
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ], default='MEDIUM')
    sent_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.subject} - {self.sender.first_name} to {self.receiver.first_name}"

class Notification(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=[
        ('INFO', 'Information'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('SUCCESS', 'Success'),
        ('REMINDER', 'Reminder'),
    ], default='INFO')
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    action_url = models.URLField(null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.user.first_name}"
```

### 5.3.9 Extended Models

```python
# apps/users/models.py (continued)

class DisciplinaryRecord(models.Model):
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='disciplinary_records')
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)
    incident_date = models.DateField()
    incident_type = models.CharField(max_length=50, choices=[
        ('LATE_COMING', 'Late Coming'),
        ('ABSENTEEISM', 'Absenteeism'),
        ('MISCONDUCT', 'Misconduct'),
        ('BULLYING', 'Bullying'),
        ('DAMAGE_PROPERTY', 'Damage to Property'),
        ('CHEATING', 'Cheating'),
        ('OTHER', 'Other'),
    ])
    description = models.TextField()
    action_taken = models.TextField(null=True, blank=True)
    severity = models.CharField(max_length=10, choices=[
        ('MINOR', 'Minor'),
        ('MODERATE', 'Moderate'),
        ('MAJOR', 'Major'),
        ('SEVERE', 'Severe'),
    ], default='MINOR')
    parent_notified = models.BooleanField(default=False)
    parent_notification_date = models.DateTimeField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    resolution_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.user.first_name} - {self.incident_type} ({self.incident_date})"

class StudentNote(models.Model):
    student = models.ForeignKey('Student', on_delete=models.CASCADE, related_name='notes')
    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE)
    note_type = models.CharField(max_length=20, choices=[
        ('ACADEMIC', 'Academic'),
        ('BEHAVIORAL', 'Behavioral'),
        ('GENERAL', 'General'),
        ('MEDICAL', 'Medical'),
        ('ACHIEVEMENT', 'Achievement'),
    ], default='GENERAL')
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_private = models.BooleanField(default=False)  # Only visible to teachers/admin
    parent_visible = models.BooleanField(default=True)  # Visible to parents
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student.user.first_name} - {self.title}"
```

### 5.3.10 System and Utility Models

```python
# apps/core/models.py
from django.db import models

class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.key

class AuditLog(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, null=True, blank=True)
    action = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=50)  # User, Student, Class, etc.
    resource_id = models.CharField(max_length=50, null=True, blank=True)
    old_values = models.JSONField(null=True, blank=True)
    new_values = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.first_name if self.user else 'System'} - {self.action} ({self.timestamp})"

class FileUpload(models.Model):
    file = models.FileField(upload_to='uploads/')
    original_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.PositiveIntegerField()
    uploaded_by = models.ForeignKey('users.User', on_delete=models.CASCADE)
    upload_date = models.DateTimeField(auto_now_add=True)
    is_public = models.BooleanField(default=False)
    description = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.original_name} - {self.uploaded_by.first_name}"

class UserSession(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    session_key = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"{self.user.first_name} - {self.ip_address}"

class ReportCache(models.Model):
    report_name = models.CharField(max_length=100)
    parameters = models.JSONField()
    cached_data = models.JSONField()
    generated_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['report_name', 'parameters']

    def __str__(self):
        return f"{self.report_name} - {self.generated_at.date()}"
```

### 5.3.11 Database Configuration

```python
# studentflow/settings/base.py
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
        'OPTIONS': {
            'timeout': 20,
            'check_same_thread': False,
        }
    }
}

# For development with file-based SQLite
if os.getenv('DJANGO_ENV') == 'development':
    DATABASES['default'].update({
        'OPTIONS': {
            'timeout': 20,
            'check_same_thread': False,
        }
    })
```

### 5.3.12 Migration Strategy

```python
# Create migrations for all apps
# python manage.py makemigrations users academics attendance examinations assignments fees communications core

# Apply migrations
# python manage.py migrate

# Create superuser
# python manage.py createsuperuser
```

### 5.3.13 Performance Optimizations

```python
# Indexing strategy in models.py
class Meta:
    indexes = [
        models.Index(fields=['created_at']),
        models.Index(fields=['academic_year']),
        models.Index(fields=['student', 'date']),
        models.Index(fields=['teacher', 'subject']),
    ]
```

### 5.3.14 Data Integrity

```python
# Constraints and validations
class Meta:
    constraints = [
        models.UniqueConstraint(fields=['student', 'exam_schedule'], name='unique_grade'),
        models.CheckConstraint(check=models.Q(marks_obtained__gte=0), name='positive_marks'),
    ]
```

This Django ORM-based SQLite database design provides:
- Full type safety with Django model definitions
- Comprehensive relationship management
- Built-in admin interface support
- Migration capabilities
- SQLite simplicity with Django ORM power
- Extensible architecture for future enhancements