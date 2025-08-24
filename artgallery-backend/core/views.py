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
from rest_framework.decorators import action


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
    
    def list(self, request, *args, **kwargs):
        """Override to include art_pieces in the response"""
        response = super().list(request, *args, **kwargs)
        
        # Add art_pieces to each exhibition
        if hasattr(response.data, 'get') and 'results' in response.data:
            # Paginated response
            exhibitions = response.data['results']
        else:
            # Non-paginated response
            exhibitions = response.data if isinstance(response.data, list) else [response.data]
        
        for exhibition_data in exhibitions:
            if 'id' in exhibition_data:
                exhibition_id = exhibition_data['id']
                art_pieces = ArtPiece.objects.filter(
                    exhibitionartpiece__exhibition_id=exhibition_id
                )
                exhibition_data['art_pieces'] = ArtPieceSerializer(art_pieces, many=True).data
        
        return response
    
    def retrieve(self, request, *args, **kwargs):
        """Override to include art_pieces in single exhibition response"""
        response = super().retrieve(request, *args, **kwargs)
        
        exhibition_id = response.data.get('id')
        if exhibition_id:
            art_pieces = ArtPiece.objects.filter(
                exhibitionartpiece__exhibition_id=exhibition_id
            )
            response.data['art_pieces'] = ArtPieceSerializer(art_pieces, many=True).data
        
        return response


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
    serializer_class = RegistrationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['visitor', 'exhibition', 'status', 'confirmed']
    
    def get_queryset(self):
        user = self.request.user
        user_role = getattr(user, 'role', 'visitor')

        if user_role in ['clerk', 'admin']:
            # Clerks and admins can see all registrations with related data
            return Registration.objects.select_related('visitor', 'exhibition').order_by('-timestamp')
        
        try:
            # Visitors only see their own registrations
            visitor = Visitor.objects.get(email=user.email)
            return Registration.objects.filter(visitor=visitor).select_related('visitor', 'exhibition').order_by('-timestamp')
        except Visitor.DoesNotExist:
            return Registration.objects.none()
    
    @action(detail=False, methods=['get'])
    def my(self, request):
        """Get current user's registrations"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve(self, request, pk=None):
        """Approve a registration (clerk/admin only)"""
        user_role = getattr(request.user, 'role', 'visitor')
        if user_role not in ['clerk', 'admin']:
            return Response(
                {'error': 'Only clerks and admins can approve registrations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            registration = self.get_object()
            if registration.status != 'PENDING':
                return Response(
                    {'error': f'Cannot approve registration with status: {registration.status}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            registration.approve(request.user)
            
            return Response({
                'message': 'Registration approved successfully',
                'registration_id': registration.id,
                'visitor': registration.visitor.name,
                'exhibition': registration.exhibition.title
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to approve registration: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        """Reject a registration (clerk/admin only)"""
        user_role = getattr(request.user, 'role', 'visitor')
        if user_role not in ['clerk', 'admin']:
            return Response(
                {'error': 'Only clerks and admins can reject registrations'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            registration = self.get_object()
            if registration.status != 'PENDING':
                return Response(
                    {'error': f'Cannot reject registration with status: {registration.status}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            reason = request.data.get('reason', '')
            registration.reject(request.user, reason)
            
            return Response({
                'message': 'Registration rejected successfully',
                'registration_id': registration.id,
                'visitor': registration.visitor.name,
                'exhibition': registration.exhibition.title,
                'reason': reason
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to reject registration: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def queue_status(self, request):
        """Get current user's queue status"""
        try:
            visitor = Visitor.objects.get(email=request.user.email)
            pending_registrations = Registration.objects.filter(
                visitor=visitor,
                status='PENDING'
            ).select_related('exhibition').order_by('queue_position')
            
            queue_info = []
            for reg in pending_registrations:
                queue_info.append({
                    'registration_id': reg.id,
                    'exhibition_title': reg.exhibition.title,
                    'queue_position': reg.queue_position,
                    'submitted_at': reg.submitted_at or reg.timestamp,
                    'estimated_wait': f"{max(1, reg.queue_position or 1)} day(s)",
                    'attendees_count': reg.attendees_count
                })
            
            return Response({
                'pending_registrations': queue_info,
                'total_in_queue': len(queue_info)
            })
            
        except Visitor.DoesNotExist:
            return Response({'pending_registrations': [], 'total_in_queue': 0})
        except Exception as e:
            return Response(
                {'error': f'Failed to get queue status: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Handle registration creation with queue system"""
        try:
            exhibition_id = request.data.get('exhibition_id')
            
            if not exhibition_id and 'exhibition' in request.data:
                exhibition_data = request.data.get('exhibition')
                if isinstance(exhibition_data, dict) and 'id' in exhibition_data:
                    exhibition_id = exhibition_data['id']
            
            if not exhibition_id:
                return Response(
                    {'error': 'exhibition_id is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                exhibition = Exhibition.objects.get(id=exhibition_id)
            except Exhibition.DoesNotExist:
                return Response(
                    {'error': 'Exhibition not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            visitor, created = Visitor.objects.get_or_create(
                email=request.user.email,
                defaults={
                    'name': f"{request.user.first_name} {request.user.last_name}".strip() or request.user.username,
                    'phone': getattr(request.user, 'phone', '')
                }
            )
            
            existing_registration = Registration.objects.filter(
                visitor=visitor, exhibition=exhibition
            ).first()
            
            if existing_registration:
                return Response(
                    {'error': 'Already registered for this exhibition'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            attendees_count = request.data.get('attendees_count', 1)
            registration = Registration.objects.create(
                visitor=visitor,
                exhibition=exhibition,
                attendees_count=attendees_count,
                status='PENDING',
                confirmed=False
            )
            
            serializer = self.get_serializer(registration)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create registration: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
    



# ---------------------------
# Dashboard Views
# ---------------------------

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user_role = getattr(request.user, 'role', 'visitor')
        
        # Base stats that match frontend expectations
        stats = {
            'total_artists': Artist.objects.count(),
            'total_exhibitions': Exhibition.objects.count(),
            'total_visitors': Visitor.objects.count(),  # Frontend expects this
            'total_artpieces': ArtPiece.objects.count(),
            'ongoing_exhibitions': Exhibition.objects.filter(status='ONGOING').count(),
            'upcoming_exhibitions': Exhibition.objects.filter(status='UPCOMING').count(),
        }
        
        # Add role-specific stats (updated for queue system)
        if user_role in ['clerk', 'admin']:
            stats.update({
                'total_registrations': Registration.objects.count(),
                'pending_registrations': Registration.objects.filter(status='PENDING').count(),  # Updated
                'confirmed_registrations': Registration.objects.filter(status='APPROVED').count(),  # Updated
                'rejected_registrations': Registration.objects.filter(status='REJECTED').count(),  # New
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
        
        # Add related data (updated for queue system)
        data['art_pieces'] = ArtPieceSerializer(
            ArtPiece.objects.filter(exhibitionartpiece__exhibition=exhibition),
            many=True
        ).data
        data['registrations_count'] = Registration.objects.filter(exhibition=exhibition).count()
        data['confirmed_registrations_count'] = Registration.objects.filter(
            exhibition=exhibition, status='APPROVED'  # Updated
        ).count()
        data['pending_registrations_count'] = Registration.objects.filter(
            exhibition=exhibition, status='PENDING'  # New
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
        
        # Create registration (updated for queue system)
        attendees_count = request.data.get('attendees_count', 1)
        registration = Registration.objects.create(
            visitor=visitor,
            exhibition=exhibition,
            attendees_count=attendees_count,
            status='PENDING',  # New registrations go to pending
            confirmed=False    # Keep for backward compatibility
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