from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, generics, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

from .models import (
    Artist, ArtPiece, Exhibition, ExhibitionArtPiece,
    Visitor, Registration, Clerk, SetupStatus
)
from .serializers import (
    ArtistSerializer, ArtPieceSerializer, ExhibitionSerializer,
    ExhibitionArtPieceSerializer, VisitorSerializer,
    RegistrationSerializer, ClerkSerializer, SetupStatusSerializer,
    UserSerializer, RegisterSerializer
)

# ---------------------------
# Authentication Views
# ---------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user data to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': getattr(self.user, 'role', 'visitor'),
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
        }
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': getattr(user, 'role', 'visitor'),
                'first_name': user.first_name,
                'last_name': user.last_name,
            },
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'detail': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

# ---------------------------
# ViewSets for Main Models
# ---------------------------

class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'bio']


class ArtPieceViewSet(viewsets.ModelViewSet):
    queryset = ArtPiece.objects.all()
    serializer_class = ArtPieceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'artist']
    search_fields = ['title', 'description']


class ExhibitionViewSet(viewsets.ModelViewSet):
    queryset = Exhibition.objects.all()
    serializer_class = ExhibitionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['title']


class ExhibitionArtPieceViewSet(viewsets.ModelViewSet):
    queryset = ExhibitionArtPiece.objects.all()
    serializer_class = ExhibitionArtPieceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exhibition', 'art_piece', 'confirmed']


class VisitorViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all()
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']


class RegistrationViewSet(viewsets.ModelViewSet):
    queryset = Registration.objects.all()
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['visitor', 'exhibition', 'confirmed']


class ClerkViewSet(viewsets.ModelViewSet):
    queryset = Clerk.objects.all()
    serializer_class = ClerkSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']


class SetupStatusViewSet(viewsets.ModelViewSet):
    queryset = SetupStatus.objects.all()
    serializer_class = SetupStatusSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exhibition', 'clerk', 'setup_confirmed', 'teardown_confirmed']

# ---------------------------
# Custom Permission Classes
# ---------------------------

class IsAdminOrReadOnly(IsAuthenticatedOrReadOnly):
    """
    Custom permission to only allow admins to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user and request.user.is_authenticated and getattr(request.user, 'role', None) == 'admin'

class IsClerkOrAdminOrReadOnly(IsAuthenticatedOrReadOnly):
    """
    Custom permission to only allow clerks and admins to edit objects.
    """
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return (request.user and request.user.is_authenticated and 
                getattr(request.user, 'role', None) in ['clerk', 'admin'])

# ---------------------------
# User Management Views
# ---------------------------

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, DjangoFilterBackend]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    filterset_fields = ['role', 'is_active']
    
    def get_queryset(self):
        # Only admins can see all users
        if getattr(self.request.user, 'role', None) == 'admin':
            return User.objects.all()
        else:
            # Regular users can only see their own profile
            return User.objects.filter(id=self.request.user.id)

# ---------------------------
# Dashboard Views
# ---------------------------

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_role = getattr(request.user, 'role', 'visitor')
        
        stats = {
            'total_artists': Artist.objects.count(),
            'total_artpieces': ArtPiece.objects.count(),
            'total_exhibitions': Exhibition.objects.count(),
            'ongoing_exhibitions': Exhibition.objects.filter(status='ONGOING').count(),
            'upcoming_exhibitions': Exhibition.objects.filter(status='UPCOMING').count(),
        }
        
        # Add role-specific stats
        if user_role in ['clerk', 'admin']:
            stats.update({
                'total_visitors': Visitor.objects.count(),
                'total_registrations': Registration.objects.count(),
                'pending_registrations': Registration.objects.filter(confirmed=False).count(),
                'confirmed_registrations': Registration.objects.filter(confirmed=True).count(),
            })
            
        if user_role == 'admin':
            stats.update({
                'total_clerks': Clerk.objects.count(),
                'total_users': User.objects.count(),
                'artpieces_available': ArtPiece.objects.filter(status='AVAILABLE').count(),
                'artpieces_displayed': ArtPiece.objects.filter(status='DISPLAYED').count(),
            })
        
        return Response(stats)

# ---------------------------
# Exhibition Management Views
# ---------------------------

class ExhibitionDetailView(generics.RetrieveAPIView):
    queryset = Exhibition.objects.all()
    serializer_class = ExhibitionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request, *args, **kwargs):
        exhibition = self.get_object()
        serializer = self.get_serializer(exhibition)
        data = serializer.data
        
        # Add related data
        data['art_pieces'] = ArtPieceSerializer(
            ArtPiece.objects.filter(exhibitionartpiece__exhibition=exhibition),
            many=True
        ).data
        data['registrations_count'] = Registration.objects.filter(exhibition=exhibition).count()
        data['confirmed_registrations_count'] = Registration.objects.filter(
            exhibition=exhibition, confirmed=True
        ).count()
        
        return Response(data)

class ExhibitionRegistrationView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request, exhibition_id):
        try:
            exhibition = Exhibition.objects.get(id=exhibition_id)
        except Exhibition.DoesNotExist:
            return Response(
                {'error': 'Exhibition not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get or create visitor profile for the user
        visitor, created = Visitor.objects.get_or_create(
            email=request.user.email,
            defaults={
                'name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                'phone': getattr(request.user, 'phone', '')
            }
        )
        
        # Check if already registered
        existing_registration = Registration.objects.filter(
            visitor=visitor, exhibition=exhibition
        ).first()
        
        if existing_registration:
            return Response(
                {'error': 'Already registered for this exhibition'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create registration
        attendees_count = request.data.get('attendees_count', 1)
        registration = Registration.objects.create(
            visitor=visitor,
            exhibition=exhibition,
            attendees_count=attendees_count,
            confirmed=False  # Clerk needs to confirm
        )
        
        return Response(
            RegistrationSerializer(registration).data,
            status=status.HTTP_201_CREATED
        )

# ---------------------------
# Visitor Management Views
# ---------------------------

class MyRegistrationsView(generics.ListAPIView):
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        try:
            visitor = Visitor.objects.get(email=self.request.user.email)
            return Registration.objects.filter(visitor=visitor).order_by('-timestamp')
        except Visitor.DoesNotExist:
            return Registration.objects.none()

# ---------------------------
# Artist Management Views (Admin only)
# ---------------------------

class ArtistDetailView(generics.RetrieveAPIView):
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get(self, request, *args, **kwargs):
        artist = self.get_object()
        serializer = self.get_serializer(artist)
        data = serializer.data
        
        # Add artist's art pieces
        data['art_pieces'] = ArtPieceSerializer(
            ArtPiece.objects.filter(artist=artist),
            many=True
        ).data
        
        return Response(data)

# ---------------------------
# Error Handlers
# ---------------------------

class APIHealthCheckView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'healthy',
            'message': 'Art Gallery API is running',
            'version': '1.0.0'
        })

# ---------------------------
# Custom Viewset Mixins
# ---------------------------

class TimestampMixin:
    """Add timestamp information to viewset responses"""
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        response.data['timestamp'] = timezone.now().isoformat()
        return response
    
    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        response.data['timestamp'] = timezone.now().isoformat()
        return response

# Apply custom permissions to existing viewsets
# Update the existing viewsets with proper permissions

# Override the existing viewsets with better permissions
ArtistViewSet.permission_classes = [IsAdminOrReadOnly]
ArtPieceViewSet.permission_classes = [IsAdminOrReadOnly]
ExhibitionViewSet.permission_classes = [IsClerkOrAdminOrReadOnly]
ClerkViewSet.permission_classes = [IsAdminOrReadOnly]
SetupStatusViewSet.permission_classes = [IsClerkOrAdminOrReadOnly]