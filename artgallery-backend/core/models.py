from django.db import models

class Artist(models.Model):
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True, null=True)
    contact_info = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.name

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

class ExhibitionArtPiece(models.Model):
    exhibition = models.ForeignKey(Exhibition, on_delete=models.CASCADE)
    art_piece = models.ForeignKey(ArtPiece, on_delete=models.CASCADE)
    confirmed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('exhibition', 'art_piece')

class Visitor(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True, null=True)

    def __str__(self):
        return self.name

class Registration(models.Model):
    visitor = models.ForeignKey(Visitor, on_delete=models.CASCADE)
    exhibition = models.ForeignKey(Exhibition, on_delete=models.CASCADE)
    attendees_count = models.PositiveIntegerField(default=1)
    confirmed = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

class Clerk(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)

    def __str__(self):
        return self.name

class SetupStatus(models.Model):
    exhibition = models.ForeignKey(Exhibition, on_delete=models.CASCADE)
    clerk = models.ForeignKey(Clerk, on_delete=models.CASCADE)
    setup_confirmed = models.BooleanField(default=False)
    teardown_confirmed = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
