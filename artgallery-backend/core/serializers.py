from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

# Add this line to define User
User = get_user_model()

class ArtistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Artist
        fields = '__all__'

class ArtPieceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ArtPiece
        fields = '__all__'

class ExhibitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exhibition
        fields = '__all__'

class ExhibitionArtPieceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExhibitionArtPiece
        fields = '__all__'

class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = '__all__'

class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = '__all__'

class ClerkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clerk
        fields = '__all__'

class SetupStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = SetupStatus
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name']

class RegisterSerializer(serializers.ModelSerializer):
    # Include nested visitor and exhibition data
    visitor_name = serializers.CharField(source='visitor.name', read_only=True)
    visitor_email = serializers.CharField(source='visitor.email', read_only=True)
    exhibition_title = serializers.CharField(source='exhibition.title', read_only=True)
    exhibition_status = serializers.CharField(source='exhibition.status', read_only=True)
    
    # Include full nested objects as well (optional, for detailed views)
    visitor = VisitorSerializer(read_only=True)
    exhibition = ExhibitionSerializer(read_only=True)
    
    class Meta:
        model = Registration
        fields = [
            'id',
            'visitor',
            'exhibition', 
            'attendees_count',
            'status',
            'confirmed',
            'queue_position',
            'submitted_at',
            'timestamp',
            'reviewed_by',
            'reviewed_at',
            'rejection_reason',
            'visitor_notified',
            # Add the new fields for easy access
            'visitor_name',
            'visitor_email',
            'exhibition_title',
            'exhibition_status'
        ]
        read_only_fields = ['id', 'timestamp', 'submitted_at', 'reviewed_by', 'reviewed_at']