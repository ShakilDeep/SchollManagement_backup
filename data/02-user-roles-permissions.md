# User Roles & Permissions

## Role-Based Access Control (RBAC) with Django

### 3.1 Super Administrator (SUPER_ADMIN)
- **System Access**: Full system access and configuration
- **User Management**: Create, update, delete all user types
- **Academic Management**: Academic year and session management
- **System Configuration**: System settings and configurations
- **Data Management**: Backup and data management
- **Django Permissions**: All permissions across all apps
- **Special Access**: Can access Django admin panel with full privileges

### 3.2 School Administrator (SCHOOL_ADMIN)
- **User Management**: Manage teachers, students, and parents within their school
- **Reports & Analytics**: View all reports and analytics for their school
- **Leave Management**: Approve/reject leave requests
- **Fee Management**: Manage fee structures and payments
- **Module Access**: Access to all modules except system configuration
- **Django Groups**: Member of 'school_admins' group
- **Limitations**: Cannot access other schools' data in multi-school setup

### 3.3 Teacher (TEACHER)
- **Class Management**: View assigned classes and subjects
- **Attendance**: Mark attendance for assigned students
- **Grades**: Enter and update grades for assigned subjects
- **Assignments**: Create and manage assignments
- **Communication**: Communicate with students and parents
- **Student Profiles**: View student profiles (limited to assigned students)
- **Django Permissions**: Limited to own classes and subjects
- **Schedule**: View and manage class timetable

### 3.4 Student (STUDENT)
- **Profile**: View personal profile and academic information
- **Schedule**: Access class schedule and timetable
- **Academic Records**: View grades and attendance records
- **Assignments**: Submit assignments and view feedback
- **Communication**: View announcements and communicate with teachers
- **Study Materials**: Access study materials shared by teachers
- **Limitations**: Cannot view other students' information
- **Self-Service**: Update personal information (limited fields)

### 3.5 Parent (PARENT)
- **Child Monitoring**: View child's academic performance and progress
- **Attendance**: View attendance records and patterns
- **Communication**: Communicate with teachers and school administration
- **Fee Status**: View fee payment status and history
- **Notifications**: Receive notifications about child's activities
- **Reports**: Access child's reports and progress reports
- **Limitations**: Can only view information for their linked children
- **Multi-Child**: Parents can have multiple children linked to their account

## Django Implementation Details

### User Model Integration
```python
# apps/users/models.py
class User(AbstractUser):
    role = models.CharField(max_length=20, choices=[
        ('SUPER_ADMIN', 'Super Admin'),
        ('SCHOOL_ADMIN', 'School Admin'),
        ('TEACHER', 'Teacher'),
        ('STUDENT', 'Student'),
        ('PARENT', 'Parent'),
    ], default='STUDENT')
```

### Role-Specific Models
- **Student Profile**: Extended student information linked to User
- **Teacher Profile**: Teacher details, qualifications, and subjects
- **Parent Profile**: Parent information and linked students
- **Admin Profile**: School administrator details

### Permission System
- **Django Permissions**: Built-in Django auth permissions
- **Custom Permissions**: App-specific permissions for fine-grained control
- **Object-Level Permissions**: Row-level security for multi-tenant access
- **Group-Based Access**: Django groups for role management

### Authentication & Authorization
- **Django Allauth**: Complete authentication solution
- **JWT Tokens**: For API authentication
- **Session Management**: Django sessions for web interface
- **Two-Factor Authentication**: Optional security enhancement

### API Access Control
```python
# Example permission checks in views
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import permission_classes

@permission_classes([IsAuthenticated])
def student_grades_view(request):
    # Only students can view their own grades
    if request.user.role == 'STUDENT':
        return get_student_grades(request.user.student_profile)
    elif request.user.role == 'PARENT':
        return get_children_grades(request.user.parent_profile)
```