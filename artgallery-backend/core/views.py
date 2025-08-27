from django.contrib.auth import get_user_model, authenticate
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models, transaction, IntegrityError
from django.db.models import Max,F
from rest_framework import viewsets, filters, generics, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny

import logging,traceback
import json

# Set up logging
logger = logging.getLogger(__name__)

User = get_user_model()

from .models import (
    Artist, ArtPiece, Exhibition, ExhibitionArtPiece,
    Visitor, Registration, Clerk, SetupStatus
)

from .serializers import (
    ArtistSerializer, ArtPieceSerializer, ExhibitionSerializer,
    ExhibitionArtPieceSerializer, VisitorSerializer,
    RegistrationSerializer, ClerkSerializer, SetupStatusSerializer,
    UserSerializer, UserRegistrationSerializer,
    RegistrationCreateSerializer
)

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
    serializer_class = UserRegistrationSerializer 
    
    def create(self, request, *args, **kwargs):
        try:
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
        
        except IntegrityError as e:
            logger.error(f"Registration integrity error: {e}")
            return Response({
                'error': 'A user with this username or email already exists.'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Registration error: {e}")
            return Response({
                'error': 'Registration failed. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            logger.error(f"Logout error: {e}")
            return Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

# ---------------------------
# ViewSets for Main Models
# ---------------------------

class ArtistViewSet(viewsets.ModelViewSet):
    queryset = Artist.objects.all().order_by('name')
    serializer_class = ArtistSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'bio']


class ArtPieceViewSet(viewsets.ModelViewSet):
    queryset = ArtPiece.objects.all().order_by('title')
    serializer_class = ArtPieceSerializer
    permission_classes = [IsClerkOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status', 'artist']
    search_fields = ['title', 'description']


class ExhibitionViewSet(viewsets.ModelViewSet):
    queryset = Exhibition.objects.all().order_by('-start_date')
    serializer_class = ExhibitionSerializer
    permission_classes = [IsClerkOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['title']


class ExhibitionArtPieceViewSet(viewsets.ModelViewSet):
    queryset = ExhibitionArtPiece.objects.all().order_by('exhibition', 'art_piece')
    serializer_class = ExhibitionArtPieceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exhibition', 'art_piece', 'confirmed']


class VisitorViewSet(viewsets.ModelViewSet):
    queryset = Visitor.objects.all().order_by('name')
    serializer_class = VisitorSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']


class RegistrationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly] 
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['visitor', 'exhibition', 'status', 'confirmed']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RegistrationCreateSerializer
        return RegistrationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Registration.objects.none()
            
        user_role = getattr(user, 'role', 'visitor')

        if user_role in ['clerk', 'admin']:
            return Registration.objects.select_related('visitor', 'exhibition').order_by('-timestamp')
        
        try:
            visitor = Visitor.objects.get(email=user.email)
            return Registration.objects.filter(visitor=visitor).select_related('visitor', 'exhibition').order_by('-timestamp')
        except Visitor.DoesNotExist:
            return Registration.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required to create registration'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Safe way to log user info that handles anonymous users
        user_identifier = request.user.email
        logger.info(f"Registration create called - User: {user_identifier}")
        
        # Debug logging to understand request data structure
        logger.info(f"Request data type: {type(request.data)}")
        logger.info(f"Request data: {request.data}")
        
        try:
            # Start transaction
            with transaction.atomic():
                # Handle different data formats
                if isinstance(request.data, str):
                    try:
                        data = json.loads(request.data)
                        logger.info(f"Parsed JSON data: {data}")
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse JSON data: {e}")
                        return Response(
                            {'error': 'Invalid JSON data format'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif hasattr(request.data, 'get'):
                    data = request.data
                else:
                    logger.error(f"Unsupported data format: {type(request.data)}")
                    return Response(
                        {'error': 'Unsupported data format'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Get exhibition ID - try both field names
                exhibition_id = data.get('exhibition') or data.get('exhibition_id')
                
                if not exhibition_id:
                    logger.error("No exhibition ID provided in request")
                    return Response(
                        {'error': 'Exhibition ID is required', 'field': 'exhibition'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Convert to integer if it's a string
                try:
                    exhibition_id = int(exhibition_id)
                except (ValueError, TypeError):
                    logger.error(f"Invalid exhibition ID format: {exhibition_id}")
                    return Response(
                        {'error': 'Exhibition ID must be a valid number', 'field': 'exhibition'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate exhibition exists and is available
                try:
                    exhibition = Exhibition.objects.get(id=exhibition_id)
                    logger.info(f"Exhibition found: {exhibition.title} (Status: {exhibition.status})")
                    
                    # Check if exhibition is available for registration
                    if exhibition.status not in ['UPCOMING', 'ONGOING']:
                        return Response(
                            {'error': f'Registration is not available for exhibitions with status: {exhibition.status}'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                        
                except Exhibition.DoesNotExist:
                    logger.error(f"Exhibition with id {exhibition_id} not found")
                    return Response(
                        {'error': 'Exhibition not found', 'field': 'exhibition'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Get or create visitor profile - safely handle user attributes
                visitor_name = ""
                if hasattr(request.user, 'first_name') and hasattr(request.user, 'last_name'):
                    visitor_name = f"{request.user.first_name} {request.user.last_name}".strip()
                
                if not visitor_name and hasattr(request.user, 'username'):
                    visitor_name = request.user.username
                
                if not visitor_name:
                    visitor_name = request.user.email  # Fallback to email
                
                try:
                    visitor, created = Visitor.objects.get_or_create(
                        email=request.user.email,
                        defaults={
                            'name': visitor_name,
                            'phone': getattr(request.user, 'phone', '')
                        }
                    )
                    
                    # Update visitor name if it was empty
                    if not visitor.name:
                        visitor.name = visitor_name
                        visitor.save()
                        
                    logger.info(f"Visitor {'created' if created else 'found'}: {visitor.name} ({visitor.email})")
                    
                except Exception as e:
                    logger.error(f"Error with visitor creation: {e}")
                    return Response(
                        {'error': f'Failed to create visitor profile: {str(e)}'}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
                
                # Check for duplicate registration
                existing_registration = Registration.objects.filter(
                    visitor=visitor, 
                    exhibition=exhibition
                ).first()
                
                if existing_registration:
                    logger.info(f"Duplicate registration attempt - existing: {existing_registration.id}")
                    return Response(
                        {
                            'error': 'You have already registered for this exhibition',
                            'existing_registration_id': existing_registration.id,
                            'status': existing_registration.status,
                            'attendees_count': existing_registration.attendees_count
                        }, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Validate attendees count
                attendees_count = data.get('attendees_count', 1)
                try:
                    attendees_count = int(attendees_count)
                    if attendees_count < 1:
                        return Response(
                            {'error': 'Attendees count must be at least 1', 'field': 'attendees_count'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if attendees_count > 10:
                        return Response(
                            {'error': 'Maximum 10 attendees allowed per registration', 'field': 'attendees_count'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                except (ValueError, TypeError):
                    return Response(
                        {'error': 'Attendees count must be a valid number', 'field': 'attendees_count'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                logger.info(f"Creating registration: Exhibition={exhibition_id}, Attendees={attendees_count}")
                
                # Create the registration
                registration_data = {
                    'visitor': visitor,
                    'exhibition': exhibition,
                    'attendees_count': attendees_count,
                    'status': 'PENDING',
                    'confirmed': False
                }
                
                # Add optional fields only if they exist in the model
                registration_fields = [f.name for f in Registration._meta.get_fields()]
                if 'submitted_at' in registration_fields:
                    registration_data['submitted_at'] = timezone.now()
                
                registration = Registration.objects.create(**registration_data)
                
                logger.info(f"Registration created successfully: ID={registration.id}")
                
                # Prepare response data
                response_data = {
                    'id': registration.id,
                    'visitor': visitor.id,
                    'exhibition': exhibition.id,
                    'attendees_count': registration.attendees_count,
                    'status': registration.status,
                    'confirmed': registration.confirmed,
                    'timestamp': registration.timestamp.isoformat(),
                    'visitor_name': visitor.name,
                    'visitor_email': visitor.email,
                    'exhibition_title': exhibition.title,
                    'exhibition_status': exhibition.status
                }
                
                # Add optional fields if they exist
                if hasattr(registration, 'queue_position') and registration.queue_position:
                    response_data['queue_position'] = registration.queue_position
                if hasattr(registration, 'submitted_at') and registration.submitted_at:
                    response_data['submitted_at'] = registration.submitted_at.isoformat()
                
                return Response(response_data, status=status.HTTP_201_CREATED)
                
        except IntegrityError as e:
            error_msg = str(e).lower()
            logger.error(f"Registration integrity error: {e}")
            
            if 'unique' in error_msg or 'duplicate' in error_msg:
                return Response(
                    {'error': 'You have already registered for this exhibition'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            else:
                return Response(
                    {'error': 'Registration failed due to data conflict'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Registration creation error: {e}")
            logger.error(f"Full traceback: {traceback.format_exc()}")
            
            return Response(
                {
                    'error': f'Registration failed: {str(e)}',
                    'type': type(e).__name__
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
            
            # Check if Registration model has approve method
            if hasattr(registration, 'approve'):
                registration.approve(request.user)
            else:
                # Manual approval if no approve method exists
                registration.status = 'APPROVED'
                registration.confirmed = True
                registration.reviewed_by = request.user
                registration.reviewed_at = timezone.now()
                registration.save()
            
            return Response({
                'message': 'Registration approved successfully',
                'registration_id': registration.id,
                'visitor': registration.visitor.name,
                'exhibition': registration.exhibition.title
            })
        except Exception as e:
            logger.error(f"Registration approval error: {e}")
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
            
            # Check if Registration model has reject method
            if hasattr(registration, 'reject'):
                registration.reject(request.user, reason)
            else:
                # Manual rejection if no reject method exists
                registration.status = 'REJECTED'
                registration.confirmed = False
                registration.reviewed_by = request.user
                registration.reviewed_at = timezone.now()
                registration.rejection_reason = reason
                registration.save()
            
            return Response({
                'message': 'Registration rejected successfully',
                'registration_id': registration.id,
                'visitor': registration.visitor.name,
                'exhibition': registration.exhibition.title,
                'reason': reason
            })
        except Exception as e:
            logger.error(f"Registration rejection error: {e}")
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
                    'queue_position': getattr(reg, 'queue_position', None),
                    'submitted_at': getattr(reg, 'submitted_at', None) or reg.timestamp,
                    'estimated_wait': f"{max(1, getattr(reg, 'queue_position', 1) or 1)} day(s)",
                    'attendees_count': reg.attendees_count
                })
            
            return Response({
                'pending_registrations': queue_info,
                'total_in_queue': len(queue_info)
            })
            
        except Visitor.DoesNotExist:
            return Response({'pending_registrations': [], 'total_in_queue': 0})
        except Exception as e:
            logger.error(f"Queue status error: {e}")
            return Response(
                {'error': f'Failed to get queue status: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClerkViewSet(viewsets.ModelViewSet):
    queryset = Clerk.objects.all().order_by('name')
    serializer_class = ClerkSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']


class SetupStatusViewSet(viewsets.ModelViewSet):
    queryset = SetupStatus.objects.all().order_by('-timestamp')
    serializer_class = SetupStatusSerializer
    permission_classes = [IsClerkOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['exhibition', 'clerk', 'setup_confirmed', 'teardown_confirmed']

# ---------------------------
# User Management Views
# ---------------------------

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('username')
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
    queryset = Exhibition.objects.all().order_by('-start_date')
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
    queryset = Artist.objects.all().order_by('name')
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