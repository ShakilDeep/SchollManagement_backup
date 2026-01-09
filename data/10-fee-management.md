# Fee Management Module

## Django Fee Management System

### 7.1 Architecture Overview
- **Django Models**: Comprehensive fee structure and payment tracking
- **Payment Gateway**: Integration with multiple payment gateways
- **Admin Interface**: Django admin for fee management
- **REST API**: Full CRUD operations for frontend integration
- **Validation**: Django validators for financial constraints
- **Notifications**: Email and SMS reminders for fee payments
- **Reporting**: Comprehensive financial reports and analytics

### 7.2 Fee Management Models

#### 7.2.1 Core Fee Models
```python
# apps/fees/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

class FeeCategory(models.Model):
    FEE_TYPES = [
        ('TUITION', 'Tuition Fee'),
        ('TRANSPORT', 'Transport Fee'),
        ('LIBRARY', 'Library Fee'),
        ('LABORATORY', 'Laboratory Fee'),
        ('SPORTS', 'Sports Fee'),
        ('EXAMINATION', 'Examination Fee'),
        ('HOSTEL', 'Hostel Fee'),
        ('UNIFORM', 'Uniform Fee'),
        ('STATIONERY', 'Stationery Fee'),
        ('OTHER', 'Other Fee'),
    ]
    
    name = models.CharField(max_length=100)
    fee_type = models.CharField(max_length=20, choices=FEE_TYPES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    is_optional = models.BooleanField(default=False)
    is_refundable = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
        unique_together = ['name', 'fee_type']
    
    def __str__(self):
        return f"{self.name} ({self.get_fee_type_display()})"

class FeeStructure(models.Model):
    FREQUENCY_CHOICES = [
        ('ONE_TIME', 'One Time'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('HALF_YEARLY', 'Half Yearly'),
        ('YEARLY', 'Yearly'),
        ('INSTALLMENT', 'Installment Based'),
    ]
    
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    academic_year = models.ForeignKey('academic.AcademicYear', on_delete=models.CASCADE)
    class_obj = models.ForeignKey('academic.Class', on_delete=models.CASCADE, related_name='fee_structures')
    fee_category = models.ForeignKey(FeeCategory, on_delete=models.CASCADE)
    
    # Amount and payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, default='YEARLY')
    total_installments = models.PositiveIntegerField(default=1)
    due_date = models.DateField()
    
    # Late fees and penalties
    late_fee_enabled = models.BooleanField(default=True)
    late_fee_type = models.CharField(max_length=20, choices=[
        ('FIXED', 'Fixed Amount'),
        ('PERCENTAGE', 'Percentage'),
    ], default='FIXED')
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    grace_period_days = models.PositiveIntegerField(default=0)
    
    # Discounts and concessions
    discount_enabled = models.BooleanField(default=False)
    early_payment_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sibling_discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    is_active = models.BooleanField(default=True)
    is_mandatory = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['class_obj', 'fee_category', 'academic_year']
        ordering = ['class_obj', 'fee_category']
        indexes = [
            models.Index(fields=['academic_year', 'class_obj']),
            models.Index(fields=['fee_category', 'is_active']),
            models.Index(fields=['due_date']),
        ]
    
    def __str__(self):
        return f"{self.class_obj.name} - {self.fee_category.name} ({self.academic_year.name})"
    
    def calculate_late_fee(self, days_late):
        """Calculate late fee based on configuration"""
        if not self.late_fee_enabled or days_late <= self.grace_period_days:
            return Decimal('0')
        
        if self.late_fee_type == 'FIXED':
            return self.late_fee_amount
        else:  # PERCENTAGE
            return (self.amount * self.late_fee_percentage) / 100
    
    def calculate_early_payment_discount(self):
        """Calculate early payment discount"""
        if not self.discount_enabled:
            return Decimal('0')
        
        if timezone.now().date() <= self.due_date - timezone.timedelta(days=30):
            return (self.amount * self.early_payment_discount) / 100
        return Decimal('0')

class StudentFee(models.Model):
    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('PARTIAL_PAID', 'Partially Paid'),
        ('FULLY_PAID', 'Fully Paid'),
        ('OVERDUE', 'Overdue'),
        ('WAIVED', 'Waived'),
        ('REFUNDED', 'Refunded'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='student_fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='student_fees')
    
    # Amount tracking
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pending_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_fee_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    waiver_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Payment status and dates
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    due_date = models.DateField()
    last_payment_date = models.DateField(null=True, blank=True)
    
    # Installment tracking
    installment_number = models.PositiveIntegerField(default=1)
    total_installments = models.PositiveIntegerField(default=1)
    
    # Additional information
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'fee_structure', 'installment_number']
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['student', 'payment_status']),
            models.Index(fields=['fee_structure', 'payment_status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['payment_status', 'due_date']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.fee_structure.fee_category.name}"
    
    def save(self, *args, **kwargs):
        # Calculate pending amount
        self.pending_amount = (
            self.total_amount - self.paid_amount - 
            self.discount_amount - self.waiver_amount + self.late_fee_amount
        )
        
        # Update payment status
        if self.pending_amount <= 0:
            self.payment_status = 'FULLY_PAID'
        elif self.paid_amount > 0:
            self.payment_status = 'PARTIAL_PAID'
        elif timezone.now().date() > self.due_date:
            self.payment_status = 'OVERDUE'
        else:
            self.payment_status = 'PENDING'
        
        super().save(*args, **kwargs)
    
    def update_late_fee(self):
        """Update late fee amount based on current date"""
        days_late = (timezone.now().date() - self.due_date).days
        if days_late > 0:
            self.late_fee_amount = self.fee_structure.calculate_late_fee(days_late)
            self.save()
    
    @property
    def days_overdue(self):
        """Calculate days overdue"""
        if self.payment_status in ['FULLY_PAID', 'WAIVED', 'REFUNDED']:
            return 0
        return max(0, (timezone.now().date() - self.due_date).days)

class FeePayment(models.Model):
    PAYMENT_METHODS = [
        ('CASH', 'Cash'),
        ('BANK_TRANSFER', 'Bank Transfer'),
        ('CHEQUE', 'Cheque'),
        ('CREDIT_CARD', 'Credit Card'),
        ('DEBIT_CARD', 'Debit Card'),
        ('ONLINE', 'Online Payment'),
        ('UPI', 'UPI'),
        ('MOBILE_WALLET', 'Mobile Wallet'),
    ]
    
    PAYMENT_STATUS = [
        ('PENDING', 'Pending'),
        ('PROCESSING', 'Processing'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    ]
    
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    payment_id = models.CharField(max_length=100, unique=True)  # Unique transaction ID
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='PENDING')
    
    # Transaction details
    transaction_id = models.CharField(max_length=200, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    receipt_number = models.CharField(max_length=100, unique=True, blank=True)
    
    # Dates
    payment_date = models.DateTimeField(default=timezone.now)
    processed_date = models.DateTimeField(null=True, blank=True)
    
    # Additional information
    notes = models.TextField(blank=True)
    collected_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='fee_collections')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['payment_id']),
            models.Index(fields=['payment_status', 'payment_date']),
            models.Index(fields=['student_fee', 'payment_status']),
            models.Index(fields=['payment_method']),
        ]
    
    def __str__(self):
        return f"Payment {self.payment_id} - {self.amount}"
    
    def save(self, *args, **kwargs):
        # Generate receipt number if not exists
        if not self.receipt_number and self.payment_status == 'COMPLETED':
            self.receipt_number = f"RCPT-{timezone.now().strftime('%Y%m%d')}-{self.pk:06d}"
        
        # Update processed date when payment is completed
        if self.payment_status == 'COMPLETED' and not self.processed_date:
            self.processed_date = timezone.now()
        
        super().save(*args, **kwargs)
        
        # Update student fee payment status
        if self.payment_status == 'COMPLETED':
            self.student_fee.update_payment_status()

class FeeDiscount(models.Model):
    DISCOUNT_TYPES = [
        ('PERCENTAGE', 'Percentage'),
        ('FIXED', 'Fixed Amount'),
        ('FULL_SCHOLARSHIP', 'Full Scholarship'),
    ]
    
    name = models.CharField(max_length=100)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.TextField(blank=True)
    
    # Applicability
    applicable_categories = models.ManyToManyField(FeeCategory, blank=True)
    applicable_classes = models.ManyToManyField('academic.Class', blank=True)
    
    # Conditions
    minimum_attendance_percentage = models.PositiveIntegerField(null=True, blank=True)
    minimum_gpa = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    valid_from = models.DateField()
    valid_until = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def is_applicable(self, student, fee_category):
        """Check if discount is applicable to student for specific fee category"""
        if not self.is_active:
            return False
        
        today = timezone.now().date()
        if today < self.valid_from or today > self.valid_until:
            return False
        
        if fee_category not in self.applicable_categories.all():
            return False
        
        # Add more complex logic based on student performance, etc.
        return True
    
    def calculate_discount(self, original_amount):
        """Calculate discount amount"""
        if self.discount_type == 'PERCENTAGE':
            return (original_amount * self.discount_value) / 100
        elif self.discount_type == 'FIXED':
            return min(self.discount_value, original_amount)
        else:  # FULL_SCHOLARSHIP
            return original_amount

class FeeReminder(models.Model):
    REMINDER_TYPES = [
        ('DUE_DATE', 'Due Date Reminder'),
        ('OVERDUE', 'Overdue Reminder'),
        ('PARTIAL_PAYMENT', 'Partial Payment Reminder'),
    ]
    
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='reminders')
    reminder_type = models.CharField(max_length=30, choices=REMINDER_TYPES)
    
    # Message content
    subject = models.CharField(max_length=200)
    message = models.TextField()
    
    # Delivery tracking
    sent_via_email = models.BooleanField(default=False)
    sent_via_sms = models.BooleanField(default=False)
    sent_via_app = models.BooleanField(default=False)
    
    # Dates
    scheduled_date = models.DateTimeField()
    sent_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['scheduled_date']
        indexes = [
            models.Index(fields=['student_fee', 'reminder_type']),
            models.Index(fields=['scheduled_date']),
            models.Index(fields=['sent_date']),
        ]
    
    def __str__(self):
        return f"{self.get_reminder_type_display()} - {self.student_fee.student.get_full_name()}"
```

### 7.3 Fee Management Services

#### 7.3.1 Fee Processing Services
```python
# apps/fees/services.py
from django.db import transaction
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
from datetime import timedelta
from .models import FeeStructure, StudentFee, FeePayment, FeeDiscount, FeeReminder

class FeeService:
    
    @staticmethod
    @transaction.atomic
    def generate_student_fees(student, academic_year):
        """Generate fees for a student for the academic year"""
        student_class = student.student_classes.filter(academic_year=academic_year).first()
        if not student_class:
            return []
        
        fee_structures = FeeStructure.objects.filter(
            class_obj=student_class,
            academic_year=academic_year,
            is_active=True
        )
        
        student_fees = []
        for fee_structure in fee_structures:
            # Calculate installments
            installments = fee_structure.total_installments or 1
            installment_amount = fee_structure.amount / installments
            
            for i in range(1, installments + 1):
                # Calculate due date for each installment
                if installments == 1:
                    due_date = fee_structure.due_date
                else:
                    months_between = (fee_structure.due_date.month - timezone.now().date().month) // installments
                    due_date = fee_structure.due_date - timedelta(days=months_between * 30 * (installments - i))
                
                student_fee, created = StudentFee.objects.get_or_create(
                    student=student,
                    fee_structure=fee_structure,
                    installment_number=i,
                    defaults={
                        'total_amount': installment_amount,
                        'pending_amount': installment_amount,
                        'due_date': due_date,
                        'total_installments': installments,
                    }
                )
                
                if created:
                    student_fees.append(student_fee)
        
        return student_fees
    
    @staticmethod
    @transaction.atomic
    def process_payment(student_fee, payment_data, collected_by=None):
        """Process fee payment"""
        payment = FeePayment.objects.create(
            student_fee=student_fee,
            payment_id=payment_data['payment_id'],
            amount=payment_data['amount'],
            payment_method=payment_data['payment_method'],
            transaction_id=payment_data.get('transaction_id', ''),
            notes=payment_data.get('notes', ''),
            collected_by=collected_by,
            gateway_response=payment_data.get('gateway_response', {}),
            payment_status='PROCESSING'
        )
        
        # Here you would integrate with actual payment gateway
        # For now, we'll simulate successful payment
        payment.payment_status = 'COMPLETED'
        payment.save()
        
        # Update student fee
        student_fee.paid_amount += payment.amount
        if student_fee.paid_amount >= student_fee.total_amount:
            student_fee.payment_status = 'FULLY_PAID'
            student_fee.last_payment_date = payment.payment_date.date()
        else:
            student_fee.payment_status = 'PARTIAL_PAID'
        
        student_fee.save()
        
        # Send receipt
        FeeService.send_payment_receipt(payment)
        
        return payment
    
    @staticmethod
    def send_payment_receipt(payment):
        """Send payment receipt via email"""
        try:
            subject = f'Fee Payment Receipt - {payment.receipt_number}'
            message = f"""
            Dear {payment.student_fee.student.get_full_name()},
            
            Thank you for your payment. Here are the details:
            
            Receipt Number: {payment.receipt_number}
            Amount Paid: {payment.amount}
            Payment Method: {payment.get_payment_method_display()}
            Payment Date: {payment.payment_date.strftime('%B %d, %Y')}
            
            Fee Category: {payment.student_fee.fee_structure.fee_category.name}
            Academic Year: {payment.student_fee.fee_structure.academic_year.name}
            
            Remaining Balance: {payment.student_fee.pending_amount}
            
            Thank you for choosing our institution.
            """
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[payment.student_fee.student.email],
                fail_silently=True
            )
        except Exception:
            pass  # Email failure should not stop the process
    
    @staticmethod
    def apply_discount(student_fee, discount, applied_by):
        """Apply discount to student fee"""
        if not discount.is_applicable(student_fee.student, student_fee.fee_structure.fee_category):
            raise ValueError("Discount is not applicable")
        
        discount_amount = discount.calculate_discount(student_fee.total_amount)
        student_fee.discount_amount = discount_amount
        student_fee.save()
        
        return discount_amount
    
    @staticmethod
    def calculate_student_total_fees(student, academic_year):
        """Calculate total fees for a student"""
        student_fees = StudentFee.objects.filter(
            student=student,
            fee_structure__academic_year=academic_year
        )
        
        total_amount = sum(fee.total_amount for fee in student_fees)
        total_paid = sum(fee.paid_amount for fee in student_fees)
        total_pending = sum(fee.pending_amount for fee in student_fees)
        
        return {
            'total_amount': total_amount,
            'total_paid': total_paid,
            'total_pending': total_pending,
            'payment_percentage': (total_paid / total_amount * 100) if total_amount > 0 else 0
        }
    
    @staticmethod
    def get_fee_collection_report(academic_year, start_date=None, end_date=None):
        """Generate fee collection report"""
        query = FeePayment.objects.filter(
            student_fee__fee_structure__academic_year=academic_year,
            payment_status='COMPLETED'
        )
        
        if start_date:
            query = query.filter(payment_date__gte=start_date)
        if end_date:
            query = query.filter(payment_date__lte=end_date)
        
        payments = query.select_related(
            'student_fee', 'student_fee__student', 
            'student_fee__fee_structure', 'student_fee__fee_structure__fee_category'
        )
        
        # Aggregate data
        total_collected = sum(payment.amount for payment in payments)
        payment_methods = {}
        category_wise = {}
        
        for payment in payments:
            # Payment method breakdown
            method = payment.get_payment_method_display()
            payment_methods[method] = payment_methods.get(method, 0) + payment.amount
            
            # Category wise breakdown
            category = payment.student_fee.fee_structure.fee_category.name
            category_wise[category] = category_wise.get(category, 0) + payment.amount
        
        return {
            'total_collected': total_collected,
            'total_transactions': payments.count(),
            'payment_methods': payment_methods,
            'category_wise': category_wise,
            'payments': payments
        }
    
    @staticmethod
    def send_fee_reminders():
        """Send automated fee reminders"""
        today = timezone.now().date()
        
        # Due date reminders (7 days before due date)
        due_date_reminder_date = today + timedelta(days=7)
        due_fees = StudentFee.objects.filter(
            payment_status='PENDING',
            due_date=due_date_reminder_date
        )
        
        for student_fee in due_fees:
            reminder, created = FeeReminder.objects.get_or_create(
                student_fee=student_fee,
                reminder_type='DUE_DATE',
                scheduled_date=timezone.now(),
                defaults={
                    'subject': f'Fee Payment Due Soon - {student_fee.fee_structure.fee_category.name}',
                    'message': f'Dear {student_fee.student.get_full_name()},\\n\\n'
                               f'Your fee payment of {student_fee.pending_amount} is due on '
                               f'{student_fee.due_date.strftime("%B %d, %Y")}.\\n\\n'
                               f'Please make the payment before the due date to avoid late fees.'
                }
            )
            
            if created:
                FeeService.send_reminder(reminder)
        
        # Overdue reminders
        overdue_fees = StudentFee.objects.filter(
            payment_status__in=['PENDING', 'PARTIAL_PAID'],
            due_date__lt=today
        )
        
        for student_fee in overdue_fees:
            reminder, created = FeeReminder.objects.get_or_create(
                student_fee=student_fee,
                reminder_type='OVERDUE',
                scheduled_date=timezone.now(),
                defaults={
                    'subject': f'Overdue Fee Payment - {student_fee.fee_structure.fee_category.name}',
                    'message': f'Dear {student_fee.student.get_full_name()},\\n\\n'
                               f'Your fee payment of {student_fee.pending_amount} is overdue by '
                               f'{student_fee.days_overdue} days.\\n\\n'
                               f'Please make the payment as soon as possible to avoid further penalties.'
                }
            )
            
            if created:
                FeeService.send_reminder(reminder)
    
    @staticmethod
    def send_reminder(reminder):
        """Send reminder via email and/or SMS"""
        try:
            # Send email
            if not reminder.sent_via_email:
                send_mail(
                    subject=reminder.subject,
                    message=reminder.message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[reminder.student_fee.student.email],
                    fail_silently=True
                )
                reminder.sent_via_email = True
                reminder.sent_date = timezone.now()
                reminder.save()
        except Exception:
            pass  # Email failure should not stop the process
        
        # Here you could also integrate SMS gateway
```