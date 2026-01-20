# 🛡️ School Management System - Military-Grade Security & Optimization Guide

## 🔒 SECURITY ENHANCEMENTS - Military Grade

### Backend Security (Django)

#### 1. Authentication & Authorization

**Critical: Implement Multi-Factor Authentication (MFA)**
```python
# apps/users/middleware/mfa_middleware.py
class MFAMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            if not request.session.get('mfa_verified') and request.user.requires_mfa:
                if request.path not in ['/api/auth/mfa/', '/api/auth/logout/']:
                    return JsonResponse({'error': 'MFA required'}, status=403)
        return self.get_response(request)

# apps/users/services/mfa_service.py
import pyotp
import qrcode
from io import BytesIO
import base64

class MFAService:
    @staticmethod
    def generate_secret():
        return pyotp.random_base32()

    @staticmethod
    def generate_qr_code(secret, email):
        totp = pyotp.TOTP(secret)
        uri = totp.provisioning_uri(email, issuer_name='EduCore')
        qr = qrcode.make(uri)
        buffer = BytesIO()
        qr.save(buffer)
        return base64.b64encode(buffer.getvalue()).decode()

    @staticmethod
    def verify_token(secret, token):
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=1)
```

**Critical: Implement Role-Based Access Control (RBAC) with Least Privilege**
```python
# apps/users/permissions/enhanced_rbac.py
from rest_framework.permissions import BasePermission
from functools import wraps
from django.core.cache import cache

class SuperAdminOnly(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'SUPER_ADMIN'

class AdminOrPrincipal(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role in ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL']

class OwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['SUPER_ADMIN', 'ADMIN']:
            return True
        return obj.user == request.user

def cache_permission_check(timeout=300):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            cache_key = f"perm_{request.user.id}_{request.path}"
            cached = cache.get(cache_key)
            if cached:
                return cached
            result = view_func(request, *args, **kwargs)
            cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator
```

#### 2. Data Encryption

**Critical: Encrypt Sensitive Data at Rest**
```python
# apps/core/security/encryption.py
from cryptography.fernet import Fernet
from django.conf import settings
import base64

class DataEncryption:
    def __init__(self):
        self.cipher = Fernet(settings.ENCRYPTION_KEY.encode())

    def encrypt(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt(self, encrypted_data: str) -> str:
        return self.cipher.decrypt(encrypted_data.encode()).decode()

    def encrypt_dict(self, data: dict) -> dict:
        return {k: self.encrypt(str(v)) for k, v in data.items()}

# usage in models
from django.db.models import JSONField
from apps.core.security.encryption import DataEncryption

class Student(models.Model):
    sensitive_data = models.JSONField()
    
    def save(self, *args, **kwargs):
        encryption = DataEncryption()
        self.sensitive_data = encryption.encrypt_dict(self.sensitive_data)
        super().save(*args, **kwargs)
```

**Critical: Implement Database Connection Encryption**
```python
# config/settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'sslmode': 'require',
            'sslcert': '/path/to/client-cert.pem',
            'sslkey': '/path/to/client-key.pem',
            'sslrootcert': '/path/to/ca-cert.pem',
        },
    }
}
```

#### 3. API Security

**Critical: Implement Rate Limiting with Redis**
```python
# apps/core/security/rate_limiting.py
from django.core.cache import cache
from rest_framework.response import Response
from django.utils import timezone

class AdvancedRateLimiter:
    @staticmethod
    def check_rate_limit(user, action='default'):
        limits = {
            'default': (1000, 3600),  # 1000 requests per hour
            'login': (5, 300),  # 5 attempts per 5 minutes
            'sensitive': (50, 3600),  # 50 requests per hour
            'bulk': (10, 3600),  # 10 bulk operations per hour
        }
        
        limit, window = limits.get(action, limits['default'])
        key = f"rate_limit_{user.id}_{action}"
        
        current = cache.get(key, 0)
        if current >= limit:
            return False
        
        cache.set(key, current + 1, window)
        return True

# usage in views
from apps.core.security.rate_limiting import AdvancedRateLimiter

class LoginView(APIView):
    def post(self, request):
        if not AdvancedRateLimiter.check_rate_limit(request.user, 'login'):
            return Response({'error': 'Rate limit exceeded'}, status=429)
```

**Critical: Implement API Key Rotation**
```python
# apps/users/services/api_key_rotation.py
import secrets
from django.utils import timezone
from apps.users.models import ApiKey

class ApiKeyRotationService:
    @staticmethod
    def rotate_api_key(user_id):
        old_keys = ApiKey.objects.filter(
            user_id=user_id,
            status='ACTIVE'
        ).exclude(expires_at__gt=timezone.now() + timezone.timedelta(days=30))
        
        for old_key in old_keys:
            old_key.status = 'REVOKED'
            old_key.revoked_at = timezone.now()
            old_key.save()
        
        new_key = ApiKey.objects.create(
            user_id=user_id,
            name=f'Rotated Key {timezone.now()}',
            key_id=secrets.token_urlsafe(16),
            hashed_key=secrets.token_urlsafe(32),
            scopes='read,write',
            expires_at=timezone.now() + timezone.timedelta(days=90),
            status='ACTIVE'
        )
        
        return new_key
```

#### 4. Audit Logging

**Critical: Comprehensive Audit Trail**
```python
# apps/audit/services/audit_logger.py
import json
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.audit.models import AuditLog

class AuditLogger:
    @staticmethod
    def log_action(user_id, action, entity, entity_id=None, details=None, 
                  ip_address=None, user_agent=None):
        AuditLog.objects.create(
            user_id=user_id,
            action=action,
            entity=entity,
            entity_id=entity_id,
            details=json.dumps(details) if details else None,
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=timezone.now()
        )
    
    @staticmethod
    def log_sensitive_access(user_id, resource_type, resource_id):
        AuditLogger.log_action(
            user_id=user_id,
            action='SENSITIVE_ACCESS',
            entity=resource_type,
            entity_id=resource_id,
            details={'warning': 'Access to sensitive resource logged'}
        )
```

### Frontend Security (Next.js)

#### 1. Content Security Policy

**Critical: Implement Strict CSP**
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.openai.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ].join('; ')
  )

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}
```

#### 2. API Security

**Critical: Secure API Client with Retry and Circuit Breaker**
```typescript
// lib/api/secure-client.ts
import { fetchAPI } from './client'
import { CircuitBreaker } from './circuit-breaker'

const circuitBreaker = new CircuitBreaker({
  threshold: 5,
  timeout: 10000,
  resetTimeout: 60000
})

class SecureAPIClient {
  private apiKey: string
  private encryptionKey: string

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_API_KEY || ''
    this.encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || ''
  }

  async secureRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    return circuitBreaker.execute(async () => {
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Request-ID': this.generateRequestId(),
        'X-Timestamp': Date.now().toString(),
        'X-Request-Signature': await this.signRequest(endpoint, options)
      }

      return fetchAPI<T>(endpoint, {
        ...options,
        headers
      })
    })
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async signRequest(endpoint: string, options: RequestInit): Promise<string> {
    const data = `${endpoint}:${JSON.stringify(options.body)}:${Date.now()}`
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.encryptionKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return btoa(String.fromCharCode(...new Uint8Array(signature)))
  }
}

export const secureClient = new SecureAPIClient()
```

**Critical: Implement Request Validation**
```typescript
// lib/api/validation-middleware.ts
import { z } from 'zod'

export const createValidationMiddleware = <T>(schema: z.ZodSchema<T>) => {
  return async (data: unknown): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> => {
    const result = schema.safeParse(data)
    if (!result.success) {
      return { success: false, errors: result.error }
    }
    return { success: true, data: result.data }
  }
}

// Example usage
const studentSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  rollNumber: z.string().min(5).max(20)
})

const validateStudent = createValidationMiddleware(studentSchema)
```

#### 3. Data Protection

**Critical: Client-Side Encryption for Sensitive Data**
```typescript
// lib/security/encryption.ts
import { subtle } from 'crypto'

export class ClientEncryption {
  private key: CryptoKey | null = null

  async initialize(password: string) {
    const encoder = new TextEncoder()
    const keyMaterial = await subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    this.key = await subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('fixed-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )
  }

  async encrypt(data: string): Promise<{ encrypted: string; iv: string }> {
    if (!this.key) throw new Error('Encryption not initialized')

    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.key,
      encoder.encode(data)
    )

    return {
      encrypted: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    }
  }

  async decrypt(encrypted: string, iv: string): Promise<string> {
    if (!this.key) throw new Error('Encryption not initialized')

    const decoder = new TextDecoder()
    const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
    const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0))

    const decrypted = await subtle.decrypt(
      { name: 'AES-GCM', iv: ivData },
      this.key,
      encryptedData
    )

    return decoder.decode(decrypted)
  }
}
```

## ⚡ PERFORMANCE OPTIMIZATIONS

### Backend Optimizations

#### 1. Database Optimization

**Critical: Implement Query Optimization**
```python
# apps/core/optimization/query_optimizer.py
from django.db import connection
from django.core.cache import cache
from functools import wraps
import time

def query_logger(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        queries = connection.queries
        total_time = sum(float(q['time']) for q in queries)
        
        print(f"{func.__name__} executed {len(queries)} queries in {total_time:.3f}s")
        return result
    return wrapper

class QueryOptimizer:
    @staticmethod
    def select_related_optimization(queryset):
        return queryset.select_related(
            'user', 'grade', 'section', 'academic_year', 'guardian'
        )
    
    @staticmethod
    def prefetch_related_optimization(queryset):
        return queryset.prefetch_related(
            'attendances', 'examresults', 'behaviorrecord_set'
        )
    
    @staticmethod
    def cached_query(cache_key, queryset_func, timeout=300):
        result = cache.get(cache_key)
        if result is None:
            result = queryset_func()
            cache.set(cache_key, result, timeout)
        return result
```

**Critical: Implement Database Indexing Strategy**
```python
# apps/core/optimization/indexes.py
from django.db import models

class OptimizedStudent(models.Model):
    # Composite indexes for common query patterns
    class Meta:
        indexes = [
            models.Index(fields=['grade', 'section', 'status']),
            models.Index(fields=['academic_year', 'grade']),
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['status', 'admission_date']),
            # Partial indexes for active records
            models.Index(fields=['id'], name='idx_active_students', 
                        condition=models.Q(status='Active')),
        ]
```

#### 2. Caching Strategy

**Critical: Multi-Layer Caching**
```python
# apps/core/optimization/cache.py
from django.core.cache import cache
from django.core.cache.backends.redis import RedisCache
from django.conf import settings
import hashlib
import json

class MultiLayerCache:
    def __init__(self):
        self.redis_cache = RedisCache(
            settings.CACHES['default']['LOCATION'],
            options=settings.CACHES['default']['OPTIONS']
        )
    
    def get_cache_key(self, prefix: str, *args, **kwargs) -> str:
        data = f"{prefix}:{args}:{sorted(kwargs.items())}"
        return f"mlc:{hashlib.md5(data.encode()).hexdigest()}"
    
    async def get(self, key: str, layer: int = 1):
        if layer == 1:
            return cache.get(key)
        return await self.redis_cache.get(key)
    
    async def set(self, key: str, value, timeout: int = 300, layer: int = 1):
        if layer == 1:
            cache.set(key, value, timeout)
        await self.redis_cache.set(key, value, timeout)
    
    async def invalidate_pattern(self, pattern: str):
        from redis import Redis
        redis_client = Redis.from_url(settings.CACHES['default']['LOCATION'])
        for key in redis_client.scan_iter(f"mlc:{pattern}*"):
            redis_client.delete(key)
```

#### 3. Async Processing

**Critical: Implement Celery for Background Tasks**
```python
# apps/core/celery/tasks.py
from celery import shared_task
from django.core.mail import send_mail
from apps.audit.services import AuditLogger
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def send_email_task(self, to_email, subject, message):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email='noreply@educore.com',
            recipient_list=[to_email],
            fail_silently=False
        )
        return {'status': 'success', 'email': to_email}
    except Exception as exc:
        logger.error(f"Email send failed: {exc}")
        self.retry(exc=exc, countdown=60 * (self.request.retries + 1))

@shared_task
def generate_report_task(report_id, parameters):
    from apps.reports.services import ReportGenerator
    generator = ReportGenerator()
    report = generator.generate(report_id, parameters)
    
    AuditLogger.log_action(
        user_id=parameters['user_id'],
        action='REPORT_GENERATED',
        entity='Report',
        entity_id=report_id,
        details=parameters
    )
    
    return {'report_id': report_id, 'status': 'completed'}
```

### Frontend Optimizations

#### 1. Rendering Optimization

**Critical: Implement Virtual Scrolling**
```typescript
// components/shared/virtualized-list.tsx
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

interface VirtualizedListProps<T> {
  items: T[]
  itemHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  containerHeight?: number
}

export function VirtualizedList<T>({ 
  items, 
  itemHeight, 
  renderItem, 
  containerHeight = 600 
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5
  })

  return (
    <div
      ref={parentRef}
      style={{ height: containerHeight, overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Critical: Implement React.memo and useMemo**
```typescript
// components/optimized/student-card.tsx
import { memo, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface StudentCardProps {
  student: {
    id: string
    firstName: string
    lastName: string
    rollNumber: string
    grade: string
    status: string
  }
  onClick?: () => void
}

export const StudentCard = memo(({ student, onClick }: StudentCardProps) => {
  const statusColor = useMemo(() => {
    return student.status === 'Active' ? 'bg-green-500' : 'bg-red-500'
  }, [student.status])

  const fullName = useMemo(() => 
    `${student.firstName} ${student.lastName}`, 
    [student.firstName, student.lastName]
  )

  return (
    <Card onClick={onClick} className="p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{fullName}</h3>
          <p className="text-sm text-gray-500">{student.rollNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{student.grade}</Badge>
          <Badge className={statusColor}>{student.status}</Badge>
        </div>
      </div>
    </Card>
  )
})

StudentCard.displayName = 'StudentCard'
```

#### 2. Data Fetching Optimization

**Critical: Implement Intelligent Caching with TanStack Query**
```typescript
// lib/api/react-query-optimized.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 10 * 60 * 1000,  // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: 1
    }
  }
})

// Prefetching strategy
export const prefetchStrategy = {
  students: () => queryClient.prefetchQuery({
    queryKey: ['students'],
    queryFn: () => fetchAPI('/api/students')
  }),
  attendance: () => queryClient.prefetchQuery({
    queryKey: ['attendance'],
    queryFn: () => fetchAPI('/api/attendance')
  })
}
```

**Critical: Implement Debouncing and Throttling**
```typescript
// hooks/use-debounced-value.ts
import { useState, useEffect } from 'react'

export function useDebouncedValue<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Usage in search components
import { useDebouncedValue } from '@/hooks/use-debounced-value'

function StudentSearch() {
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  useEffect(() => {
    if (debouncedSearchTerm) {
      searchStudents(debouncedSearchTerm)
    }
  }, [debouncedSearchTerm])

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search students..."
    />
  )
}
```

#### 3. Code Splitting

**Critical: Implement Dynamic Imports**
```typescript
// app/dashboard/page.tsx
import dynamic from 'next/dynamic'

const StudentList = dynamic(() => import('./components/student-list'), {
  loading: () => <StudentListSkeleton />,
  ssr: false  // Disable SSR for heavy components
})

const AttendanceChart = dynamic(() => import('./components/attendance-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
})

export default function DashboardPage() {
  return (
    <div>
      <StudentList />
      <AttendanceChart />
    </div>
  )
}
```

## 🏗️ DESIGN PATTERNS IMPLEMENTATION

### Backend Patterns

#### 1. Repository Pattern

```python
# apps/core/repositories/base_repository.py
from django.db import models
from django.core.cache import cache
from typing import TypeVar, Generic, Type, List, Optional

T = TypeVar('T', bound=models.Model)

class BaseRepository(Generic[T]):
    model: Type[T]
    cache_prefix: str = 'repo'

    def __init__(self, model: Type[T], cache_prefix: str = None):
        self.model = model
        self.cache_prefix = cache_prefix or self.cache_prefix

    def get_by_id(self, id: str, use_cache: bool = True) -> Optional[T]:
        cache_key = f"{self.cache_prefix}:get_by_id:{id}"
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached
        
        try:
            instance = self.model.objects.get(id=id)
            if use_cache:
                cache.set(cache_key, instance, 300)
            return instance
        except self.model.DoesNotExist:
            return None

    def get_all(self, use_cache: bool = True) -> List[T]:
        cache_key = f"{self.cache_prefix}:get_all"
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                return cached
        
        instances = list(self.model.objects.all())
        if use_cache:
            cache.set(cache_key, instances, 300)
        return instances

    def create(self, **kwargs) -> T:
        instance = self.model.objects.create(**kwargs)
        self._invalidate_cache()
        return instance

    def update(self, instance: T, **kwargs) -> T:
        for key, value in kwargs.items():
            setattr(instance, key, value)
        instance.save()
        self._invalidate_cache()
        return instance

    def delete(self, instance: T) -> bool:
        instance.delete()
        self._invalidate_cache()
        return True

    def _invalidate_cache(self):
        from django.core.cache import cache
        cache.delete_pattern(f"{self.cache_prefix}:*")

# Specific repository
class StudentRepository(BaseRepository[Student]):
    def __init__(self):
        super().__init__(Student, 'student')

    def get_by_grade(self, grade_id: str) -> List[Student]:
        return list(self.model.objects.filter(grade_id=grade_id))

    def get_active_students(self) -> List[Student]:
        return list(self.model.objects.filter(status='Active'))
```

#### 2. Service Layer Pattern

```python
# apps/core/services/base_service.py
from abc import ABC, abstractmethod
from typing import TypeVar, Generic, List, Optional

T = TypeVar('T')

class BaseService(ABC, Generic[T]):
    @abstractmethod
    def create(self, data: dict) -> T:
        pass

    @abstractmethod
    def update(self, id: str, data: dict) -> Optional[T]:
        pass

    @abstractmethod
    def delete(self, id: str) -> bool:
        pass

    @abstractmethod
    def get(self, id: str) -> Optional[T]:
        pass

    @abstractmethod
    def list(self, filters: dict = None) -> List[T]:
        pass

# Specific service
class StudentService(BaseService[Student]):
    def __init__(self):
        self.repository = StudentRepository()
        self.audit_logger = AuditLogger()

    def create(self, data: dict) -> Student:
        student = self.repository.create(**data)
        self.audit_logger.log_action(
            user_id=data.get('user_id'),
            action='CREATE',
            entity='Student',
            entity_id=student.id,
            details=data
        )
        return student

    def update(self, id: str, data: dict) -> Optional[Student]:
        student = self.repository.get_by_id(id)
        if not student:
            return None
        
        updated_student = self.repository.update(student, **data)
        self.audit_logger.log_action(
            user_id=data.get('user_id'),
            action='UPDATE',
            entity='Student',
            entity_id=id,
            details=data
        )
        return updated_student
```

#### 3. Factory Pattern

```python
# apps/core/factories/report_factory.py
from abc import ABC, abstractmethod

class ReportGenerator(ABC):
    @abstractmethod
    def generate(self, data: dict):
        pass

class StudentReportGenerator(ReportGenerator):
    def generate(self, data: dict):
        # Generate student report logic
        pass

class AttendanceReportGenerator(ReportGenerator):
    def generate(self, data: dict):
        # Generate attendance report logic
        pass

class ReportFactory:
    generators = {
        'student': StudentReportGenerator(),
        'attendance': AttendanceReportGenerator()
    }

    @classmethod
    def create_generator(cls, report_type: str) -> ReportGenerator:
        generator = cls.generators.get(report_type)
        if not generator:
            raise ValueError(f"Unknown report type: {report_type}")
        return generator

# Usage
generator = ReportFactory.create_generator('student')
report = generator.generate(data)
```

### Frontend Patterns

#### 1. Provider Pattern with Context

```typescript
// context/auth-context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        const userData = await fetchAPI('/api/auth/me')
        setUser(userData)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    const response = await fetchAPI('/api/auth/login', {
      method: 'POST',
      body: credentials
    })
    setUser(response.user)
    localStorage.setItem('auth_token', response.token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

#### 2. Observer Pattern with Zustand

```typescript
// stores/student-store.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface StudentState {
  students: Student[]
  loading: boolean
  error: string | null
  filters: StudentFilters
  fetchStudents: () => Promise<void>
  setFilters: (filters: Partial<StudentFilters>) => void
  updateStudent: (id: string, data: Partial<Student>) => void
  deleteStudent: (id: string) => void
}

export const useStudentStore = create<StudentState>()(
  subscribeWithSelector((set, get) => ({
    students: [],
    loading: false,
    error: null,
    filters: { grade: '', status: '' },

    fetchStudents: async () => {
      set({ loading: true, error: null })
      try {
        const { filters } = get()
        const students = await fetchAPI('/api/students', {
          query: filters
        })
        set({ students, loading: false })
      } catch (error) {
        set({ error: 'Failed to fetch students', loading: false })
      }
    },

    setFilters: (filters) => {
      set((state) => ({
        filters: { ...state.filters, ...filters }
      }))
    },

    updateStudent: (id, data) => {
      set((state) => ({
        students: state.students.map(s => 
          s.id === id ? { ...s, ...data } : s
        )
      }))
    },

    deleteStudent: (id) => {
      set((state) => ({
        students: state.students.filter(s => s.id !== id)
      }))
    }
  }))
)
```

#### 3. Strategy Pattern

```typescript
// lib/api/strategies/validation-strategy.ts
interface ValidationStrategy {
  validate(data: unknown): boolean
  getError(): string | null
}

class EmailValidationStrategy implements ValidationStrategy {
  private error: string | null = null

  validate(data: unknown): boolean {
    const email = data as string
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    if (!emailRegex.test(email)) {
      this.error = 'Invalid email format'
      return false
    }
    return true
  }

  getError(): string | null {
    return this.error
  }
}

class PasswordValidationStrategy implements ValidationStrategy {
  private error: string | null = null

  validate(data: unknown): boolean {
    const password = data as string
    
    if (password.length < 8) {
      this.error = 'Password must be at least 8 characters'
      return false
    }
    
    if (!/[A-Z]/.test(password)) {
      this.error = 'Password must contain uppercase letter'
      return false
    }
    
    return true
  }

  getError(): string | null {
    return this.error
  }
}

// Context class
class ValidationContext {
  private strategy: ValidationStrategy

  constructor(strategy: ValidationStrategy) {
    this.strategy = strategy
  }

  setStrategy(strategy: ValidationStrategy) {
    this.strategy = strategy
  }

  validate(data: unknown): boolean {
    return this.strategy.validate(data)
  }

  getError(): string | null {
    return this.strategy.getError()
  }
}

// Usage
const context = new ValidationContext(new EmailValidationStrategy())
context.validate('test@example.com')
```

## 🔧 MONITORING & LOGGING

### Backend Monitoring

```python
# apps/core/monitoring/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Define metrics
request_count = Counter(
    'django_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'django_request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)

active_connections = Gauge(
    'django_active_connections',
    'Active database connections'
)

def monitor_request(method: str, endpoint: str):
    def decorator(view_func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            status = 200
            
            try:
                response = view_func(*args, **kwargs)
                status = getattr(response, 'status_code', 200)
                return response
            except Exception as e:
                status = 500
                raise
            finally:
                duration = time.time() - start_time
                request_count.labels(
                    method=method,
                    endpoint=endpoint,
                    status=status
                ).inc()
                request_duration.labels(
                    method=method,
                    endpoint=endpoint
                ).observe(duration)
        
        return wrapper
    return decorator
```

### Frontend Monitoring

```typescript
// lib/monitoring/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number[]> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  measure(name: string, fn: () => void) {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)
    
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
  }

  async measureAsync(name: string, fn: () => Promise<void>) {
    const start = performance.now()
    await fn()
    const duration = performance.now() - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)
    
    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
  }

  getMetrics() {
    const result: Record<string, { avg: number; min: number; max: number }> = {}
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      }
    })
    
    return result
  }
}

// Usage
const monitor = PerformanceMonitor.getInstance()

function loadData() {
  monitor.measure('loadData', () => {
    // expensive operation
  })
}
```

## 🚀 DEPLOYMENT OPTIMIZATIONS

### Backend Deployment

```dockerfile
# Dockerfile.optimized
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python manage.py check || exit 1

# Gunicorn with optimized workers
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "4", \
     "--worker-class", "gevent", \
     "--worker-connections", "1000", \
     "--timeout", "120", \
     "--max-requests", "1000", \
     "--max-requests-jitter", "50"]
```

### Frontend Deployment

```dockerfile
# Dockerfile.optimized
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build with optimizations
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production && \
    npm cache clean --force

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start with optimizations
CMD ["npm", "start"]
```

## 📋 IMPLEMENTATION CHECKLIST

### Security Checklist
- [ ] Implement MFA for all admin accounts
- [ ] Enable database encryption at rest
- [ ] Implement comprehensive audit logging
- [ ] Set up automatic API key rotation
- [ ] Configure strict CSP headers
- [ ] Implement rate limiting on all endpoints
- [ ] Enable SSL/TLS for all connections
- [ ] Implement input validation and sanitization
- [ ] Set up security monitoring and alerts
- [ ] Regular security audits and penetration testing

### Performance Checklist
- [ ] Implement database query optimization
- [ ] Set up multi-layer caching strategy
- [ ] Enable database connection pooling
- [ ] Implement virtual scrolling for large lists
- [ ] Configure CDN for static assets
- [ ] Enable code splitting and lazy loading
- [ ] Implement service workers for offline support
- [ ] Set up CDN for API responses
- [ ] Optimize images and assets
- [ ] Implement proper error handling and retry logic

### Design Patterns Checklist
- [ ] Implement Repository pattern for data access
- [ ] Use Service layer for business logic
- [ ] Apply Factory pattern for object creation
- [ ] Use Observer pattern for state management
- [ ] Implement Strategy pattern for algorithms
- [ ] Use Singleton pattern for shared resources
- [ ] Apply Decorator pattern for cross-cutting concerns
- [ ] Implement Circuit Breaker pattern for resilience

## 🎯 IMMEDIATE ACTION ITEMS

1. **Week 1-2**: Security Foundation
   - Implement MFA for all admin accounts
   - Set up comprehensive audit logging
   - Configure strict CSP headers
   - Implement rate limiting

2. **Week 3-4**: Performance Foundation
   - Optimize database queries
   - Set up caching strategy
   - Implement virtual scrolling
   - Configure CDN

3. **Week 5-6**: Design Patterns
   - Implement Repository pattern
   - Set up Service layer
   - Apply Observer pattern
   - Implement Circuit Breaker

4. **Week 7-8**: Monitoring & Deployment
   - Set up monitoring dashboards
   - Configure automated alerts
   - Optimize deployment process
   - Set up CI/CD pipeline

---

**Remember**: Security and performance are ongoing processes, not one-time tasks. Regular reviews and updates are essential for maintaining military-grade standards.
