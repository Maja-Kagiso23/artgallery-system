from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import *

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

# FIXED: Create a proper RegisterSerializer for user registration
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        # Remove confirm_password from validated_data
        validated_data.pop('confirm_password', None)
        
        # Create user with hashed password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        
        # Set default role if the User model has a role field
        if hasattr(user, 'role'):
            user.role = 'visitor'
            user.save()
        
        return user