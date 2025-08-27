from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
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
    art_pieces = serializers.SerializerMethodField()
    
    class Meta:
        model = Exhibition
        fields = ['id', 'title', 'start_date', 'end_date', 'status', 'art_pieces']
    
    def get_art_pieces(self, obj):
        """Get all art pieces associated with this exhibition through ExhibitionArtPiece"""
        art_pieces = ArtPiece.objects.filter(
            exhibitionartpiece__exhibition=obj
        ).select_related('artist')
        return ArtPieceSerializer(art_pieces, many=True).data

class ExhibitionArtPieceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExhibitionArtPiece
        fields = '__all__'

class VisitorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitor
        fields = '__all__'

# RENAMED: Basic registration serializer for simple operations
class RegistrationBasicSerializer(serializers.ModelSerializer):
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

# RENAMED: User registration serializer to avoid confusion
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    # Change to required=True if you want to enforce confirmation
    confirm_password = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True, required=False)  # Changed to required=False
    
    class Meta:
        model = User
        fields = [
            'username', 
            'email', 
            'password', 
            'confirm_password', 
            'first_name', 
            'last_name'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'confirm_password': {'write_only': True},
        }
    
    def validate(self, attrs):
        # Only validate if confirm_password is provided
        confirm_password = attrs.get('confirm_password')
        if confirm_password and attrs['password'] != confirm_password:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Remove confirm_password from validated data
        attrs.pop('confirm_password', None)
        return attrs
    
    def create(self, validated_data):
        # Create user with hashed password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class RegistrationSerializer(serializers.ModelSerializer):
    visitor_name = serializers.SerializerMethodField()
    visitor_email = serializers.SerializerMethodField()
    exhibition_title = serializers.SerializerMethodField()
    exhibition_status = serializers.SerializerMethodField()
    
    class Meta:
        model = Registration
        fields = [
            'id',
            'visitor',
            'exhibition', 
            'attendees_count',
            'status',
            'confirmed',
            'timestamp',
            'queue_position',
            'submitted_at',
            'reviewed_by',
            'reviewed_at',
            'rejection_reason',
            'visitor_notified',
            # Safe computed fields
            'visitor_name',
            'visitor_email',
            'exhibition_title',
            'exhibition_status'
        ]
        read_only_fields = ['id', 'timestamp', 'submitted_at', 'reviewed_at', 'queue_position']
    
    def get_visitor_name(self, obj):
        try:
            return obj.visitor.name if obj.visitor else 'Unknown'
        except:
            return 'Unknown'
    
    def get_visitor_email(self, obj):
        try:
            return obj.visitor.email if obj.visitor else 'Unknown'
        except:
            return 'Unknown'
    
    def get_exhibition_title(self, obj):
        try:
            return obj.exhibition.title if obj.exhibition else 'Unknown'
        except:
            return 'Unknown'
    
    def get_exhibition_status(self, obj):
        try:
            return obj.exhibition.status if obj.exhibition else 'Unknown'
        except:
            return 'Unknown'
            
class RegistrationCreateSerializer(serializers.ModelSerializer):
    """Serializer specifically for creating registrations"""
    exhibition_id = serializers.IntegerField(write_only=True, required=False)
    exhibition = serializers.PrimaryKeyRelatedField(
        queryset=Exhibition.objects.all(), 
        required=False
    )
    
    class Meta:
        model = Registration
        fields = ['exhibition', 'exhibition_id', 'attendees_count']
        
    def validate(self, attrs):
        # Handle both exhibition and exhibition_id
        exhibition = attrs.get('exhibition')
        exhibition_id = attrs.get('exhibition_id')
        
        if not exhibition and not exhibition_id:
            raise serializers.ValidationError("Exhibition is required")
        
        if exhibition_id and not exhibition:
            try:
                exhibition = Exhibition.objects.get(id=exhibition_id)
                attrs['exhibition'] = exhibition
            except Exhibition.DoesNotExist:
                raise serializers.ValidationError("Exhibition not found")
        
        # Remove exhibition_id from validated data
        attrs.pop('exhibition_id', None)
        
        return attrs
    
    def create(self, validated_data):
        # Add the visitor automatically from the request user
        user = self.context['request'].user
        visitor_name = f"{user.first_name} {user.last_name}".strip()
        if not visitor_name:
            visitor_name = user.username
        
        visitor, created = Visitor.objects.get_or_create(
            email=user.email,
            defaults={
                'name': visitor_name,
                'phone': getattr(user, 'phone', '')
            }
        )
        
        validated_data['visitor'] = visitor
        validated_data['status'] = 'PENDING'
        validated_data['confirmed'] = False
        
        return super().create(validated_data)

class RegistrationDetailSerializer(serializers.ModelSerializer):
    """Serializer for detailed registration responses"""
    visitor_name = serializers.CharField(source='visitor.name', read_only=True)
    visitor_email = serializers.CharField(source='visitor.email', read_only=True)
    exhibition_title = serializers.CharField(source='exhibition.title', read_only=True)
    exhibition_status = serializers.CharField(source='exhibition.status', read_only=True)
    
    # Include nested objects for detailed views
    visitor = VisitorSerializer(read_only=True)
    exhibition = ExhibitionSerializer(read_only=True)
    
    class Meta:
        model = Registration
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']

        
        