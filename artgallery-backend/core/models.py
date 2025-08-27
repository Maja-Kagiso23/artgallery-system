from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class Artist(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    nationality = models.CharField(max_length=100, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
 
    def __str__(self):
        return self.name
        
    class Meta:
        ordering = ['name']

class ArtPiece(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('DISPLAYED', 'Displayed'),
        ('UNAVAILABLE', 'Unavailable')
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE)
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
        
    def __str__(self):
        return self.title
        
    class Meta:
        ordering = ['title', 'artist__name']

class Exhibition(models.Model):
    STATUS_CHOICES = [
        ('UPCOMING', 'Upcoming'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed')
    ]
    title = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='UPCOMING')
    art_pieces = models.ManyToManyField(ArtPiece, through='ExhibitionArtPiece')
    
    def __str__(self):
        return self.title
        
    class Meta:
        ordering = ['-start_date', 'title']

class ExhibitionArtPiece(models.Model):
    exhibition = models.ForeignKey(Exhibition, on_delete=models.CASCADE)
    art_piece = models.ForeignKey(ArtPiece, on_delete=models.CASCADE)
    confirmed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('exhibition', 'art_piece')
        ordering = ['exhibition', 'art_piece']

class Visitor(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True, null=True)

    def __str__(self):
        return self.name
        
    class Meta:
        ordering = ['name']

class Registration(models.Model):
    REGISTRATION_STATUS_CHOICES = [
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved by Clerk'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    visitor = models.ForeignKey('Visitor', on_delete=models.CASCADE)
    exhibition = models.ForeignKey('Exhibition', on_delete=models.CASCADE)
    attendees_count = models.PositiveIntegerField(default=1)
    
    # Updated status system
    status = models.CharField(
        max_length=20, 
        choices=REGISTRATION_STATUS_CHOICES, 
        default='PENDING'
    )
    
    # Keep the old 'confirmed' field for backwards compatibility
    confirmed = models.BooleanField(default=False)
    
    # Queue management
    queue_position = models.PositiveIntegerField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True, null=True)
    
    # Keep the old timestamp field for backwards compatibility
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Clerk approval tracking
    reviewed_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_registrations'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    
    # Notification flags
    visitor_notified = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['visitor', 'exhibition']
        ordering = ['queue_position', 'submitted_at']
    
    def save(self, *args, **kwargs):
        # Sync old confirmed field with new status field
        if self.status == 'APPROVED':
            self.confirmed = True
        else:
            self.confirmed = False
            
        # Auto-assign queue position for new registrations
        if not self.pk and self.status == 'PENDING':
            last_position = Registration.objects.filter(
                exhibition=self.exhibition,
                status='PENDING'
            ).aggregate(
                max_position=models.Max('queue_position')
            )['max_position']
            
            self.queue_position = (last_position or 0) + 1
            
        super().save(*args, **kwargs)
    
    def approve(self, clerk_user):
        """Approve the registration"""
        self.status = 'APPROVED'
        self.confirmed = True
        self.reviewed_by = clerk_user
        self.reviewed_at = timezone.now()
        self.visitor_notified = False  # Reset to send approval notification
        self.save()
        self._adjust_queue_positions()
    
    def reject(self, clerk_user, reason=""):
        """Reject the registration"""
        self.status = 'REJECTED'
        self.confirmed = False
        self.reviewed_by = clerk_user
        self.reviewed_at = timezone.now()
        self.rejection_reason = reason
        self.visitor_notified = False  # Reset to send rejection notification
        self.save()
        self._adjust_queue_positions()
    
    def cancel(self):
        """Cancel the registration"""
        self.status = 'CANCELLED'
        self.confirmed = False
        self.save()
        self._adjust_queue_positions()
    
    def _adjust_queue_positions(self):
        """Adjust queue positions after approval/rejection"""
        if self.queue_position:
            # Move all pending registrations up in the queue
            Registration.objects.filter(
                exhibition=self.exhibition,
                status='PENDING',
                queue_position__gt=self.queue_position
            ).update(queue_position=models.F('queue_position') - 1)
            
            self.queue_position = None
            self.save(update_fields=['queue_position'])
    
    @property
    def is_approved(self):
        return self.status == 'APPROVED'
    
    @property
    def is_pending(self):
        return self.status == 'PENDING'
    
    @property
    def days_waiting(self):
        if self.status == 'PENDING' and self.submitted_at:
            return (timezone.now() - self.submitted_at).days
        return 0
    
    def __str__(self):
        return f"{self.visitor.name} - {self.exhibition.title} ({self.status})"

class Clerk(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.name
        
    class Meta:
        ordering = ['name']

class SetupStatus(models.Model):
    exhibition = models.ForeignKey(Exhibition, on_delete=models.CASCADE)
    clerk = models.ForeignKey(Clerk, on_delete=models.CASCADE)
    setup_confirmed = models.BooleanField(default=False)
    teardown_confirmed = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']