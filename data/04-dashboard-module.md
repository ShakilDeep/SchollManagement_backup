# Dashboard Module

## Django-Powered Dashboard System

### 4.1 Dashboard Architecture Overview
- **Framework Integration**: Django Templates + Django REST Framework API
- **Real-time Updates**: Django Channels for WebSocket connections
- **Data Aggregation**: Django ORM with optimized queries
- **Caching Strategy**: Redis for dashboard performance
- **Role-Based Views**: Custom Django views for each user role

### 4.2 Role-Specific Dashboards

#### 4.2.1 Super Admin Dashboard
- **System Overview**: Total schools, users, classes across all schools
- **Platform Statistics**: User growth, active sessions, system health
- **Recent Activities**: Platform-wide audit logs and activities
- **System Health**: Database status, Redis connectivity, performance metrics
- **Administrative Actions**: Quick access to system configuration
- **Multi-School View**: Switch between different school dashboards

#### 4.2.2 School Admin Dashboard
- **School Statistics**: Total students, teachers, classes, sections
- **Academic Overview**: Current academic year, active terms, class distribution
- **Financial Summary**: Fee collection overview, pending payments, revenue charts
- **Attendance Analytics**: School-wide attendance rates, trends, and patterns
- **Recent Activities**: School-level activities, new registrations, important events
- **Quick Actions**: Add student/teacher, create class, generate reports

#### 4.2.3 Teacher Dashboard
- **Today's Schedule**: Real-time class timetable with room details
- **Assignment Management**: Pending submissions to grade, upcoming deadlines
- **Class Performance**: Student attendance, grade distribution, subject-wise metrics
- **Communication Hub**: Recent announcements, parent messages, staff notifications
- **Teaching Resources**: Quick access to lesson plans, study materials, assessments
- **Attendance Tracking**: Daily attendance input, attendance patterns for assigned classes

#### 4.2.4 Student Dashboard
- **Academic Overview**: Current grades, GPA, subject-wise performance
- **Assignment Center**: Upcoming deadlines, submitted work, graded assignments
- **Attendance Record**: Current attendance percentage, absence history
- **Class Schedule**: Personalized timetable with subject details
- **Learning Resources**: Study materials, announcements, teacher-shared content
- **Performance Analytics**: Grade trends, attendance patterns, progress reports

#### 4.2.5 Parent Dashboard
- **Children Overview**: Academic summary for all linked children
- **Performance Tracking**: Real-time grades, attendance, behavioral reports
- **Financial Information**: Fee status, payment history, upcoming dues
- **Communication Center**: Teacher messages, school announcements, event notifications
- **Calendar Integration**: School events, parent-teacher meetings, examination schedules
- **Progress Reports**: Downloadable reports, comparative analysis, growth metrics

### 4.3 Django Implementation Details

#### 4.3.1 Dashboard Views Architecture
```python
# apps/dashboard/views.py
from django.views.generic import TemplateView
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count, Avg, Sum
from django.utils import timezone
from datetime import timedelta

class DashboardView(TemplateView):
    template_name = 'dashboard/index.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        user = self.request.user
        
        if user.role == 'SUPER_ADMIN':
            context.update(self.get_super_admin_data())
        elif user.role == 'SCHOOL_ADMIN':
            context.update(self.get_school_admin_data())
        elif user.role == 'TEACHER':
            context.update(self.get_teacher_data())
        elif user.role == 'STUDENT':
            context.update(self.get_student_data())
        elif user.role == 'PARENT':
            context.update(self.get_parent_data())
            
        return context
    
    def get_super_admin_data(self):
        return {
            'total_schools': School.objects.count(),
            'total_users': User.objects.count(),
            'total_students': Student.objects.count(),
            'total_teachers': Teacher.objects.count(),
            'recent_activities': AuditLog.objects.all()[:10],
            'system_health': self.get_system_health_metrics(),
        }
```

#### 4.3.2 API Endpoints for Real-time Data
```python
# apps/dashboard/api.py
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.core.cache import cache
import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user
    cache_key = f'dashboard_stats_{user.id}_{user.role}'
    
    # Check cache first
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)
    
    # Generate dashboard data based on role
    if user.role == 'TEACHER':
        data = get_teacher_dashboard_data(user)
    elif user.role == 'STUDENT':
        data = get_student_dashboard_data(user)
    elif user.role == 'PARENT':
        data = get_parent_dashboard_data(user)
    else:
        data = get_admin_dashboard_data(user)
    
    # Cache for 5 minutes
    cache.set(cache_key, data, 300)
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def real_time_updates(request):
    """Real-time dashboard updates via WebSocket"""
    # Implementation for Django Channels integration
    pass
```

#### 4.3.3 Data Aggregation Services
```python
# apps/dashboard/services.py
from django.db.models import Count, Avg, Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta

class DashboardDataService:
    
    @staticmethod
    def get_attendance_statistics(user, days=30):
        """Calculate attendance statistics for dashboard"""
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        if user.role == 'STUDENT':
            return AttendanceRecord.objects.filter(
                student=user.student_profile,
                date__range=[start_date, end_date]
            ).aggregate(
                total_days=Count('date'),
                present_days=Count('date', filter=Q(status='PRESENT')),
                percentage=Avg('status')
            )
        elif user.role == 'TEACHER':
            return AttendanceRecord.objects.filter(
                class_schedule__teacher=user.teacher_profile,
                date__range=[start_date, end_date]
            ).aggregate(
                total_records=Count('id'),
                present_count=Count('id', filter=Q(status='PRESENT'))
            )
    
    @staticmethod
    def get_grade_analytics(user):
        """Generate grade analytics for dashboard"""
        if user.role == 'STUDENT':
            return Grade.objects.filter(
                student=user.student_profile
            ).aggregate(
                avg_grade=Avg('marks_obtained'),
                total_subjects=Count('exam_schedule__subject', distinct=True),
                recent_grades=Count('id', filter=Q(created_at__gte=timezone.now() - timedelta(days=30)))
            )
```

### 4.4 Frontend Integration (React + Django REST)

#### 4.4.1 Dashboard Component Structure
```javascript
// frontend/src/components/Dashboard/DashboardLayout.js
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData } from '../../store/slices/dashboardSlice';

const DashboardLayout = () => {
    const dispatch = useDispatch();
    const { data, loading, error } = useSelector(state => state.dashboard);
    const user = useSelector(state => state.auth.user);

    useEffect(() => {
        dispatch(fetchDashboardData());
        
        // Set up real-time updates
        const wsUrl = `ws://localhost:8000/ws/dashboard/${user.id}/`;
        const ws = new WebSocket(wsUrl);
        
        ws.onmessage = (event) => {
            const update = JSON.parse(event.data);
            // Update dashboard state with real-time data
            dispatch(updateDashboardData(update));
        };
        
        return () => ws.close();
    }, [dispatch, user.id]);

    return (
        <div className="dashboard-container">
            <RoleBasedDashboard user={user} data={data} loading={loading} />
        </div>
    );
};
```

### 4.5 Performance Optimizations

#### 4.5.1 Caching Strategy
- **Redis Integration**: Dashboard data cached for 5-15 minutes
- **Database Query Optimization**: `select_related` and `prefetch_related`
- **Computed Fields**: Pre-calculated statistics updated via signals
- **Background Tasks**: Heavy analytics processed by Celery workers

#### 4.5.2 Real-time Features
- **Django Channels**: WebSocket connections for live updates
- **Push Notifications**: Real-time notifications for important events
- **Event-Driven Updates**: Database signals trigger cache invalidation

### 4.6 Mobile Responsiveness & Accessibility
- **Responsive Design**: Mobile-first approach with breakpoints
- **Progressive Web App**: Offline capabilities for dashboard data
- **Accessibility**: WCAG 2.1 compliance with screen reader support
- **Performance**: Lazy loading for dashboard widgets