from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('clerk', 'Clerk'),
        ('visitor', 'Visitor'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='visitor')
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return self.username