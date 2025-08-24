"""
URL configuration for artgallery project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import routers
from rest_framework_simplejwt.views import TokenRefreshView
from core.views import (
    RegisterView, 
    CustomTokenObtainPairView, 
    LogoutView,
    UserProfileView,
    UserListView,
    DashboardStatsView,
    ExhibitionDetailView,
    ExhibitionRegistrationView,
    PublicExhibitionListView,
    MyRegistrationsView,
    ArtistDetailView,
    APIHealthCheckView
)
from core import views

router = routers.DefaultRouter()
router.register(r'artists', views.ArtistViewSet)
router.register(r'artpieces', views.ArtPieceViewSet)
router.register(r'exhibitions', views.ExhibitionViewSet)
router.register(r'exhibition-artpieces', views.ExhibitionArtPieceViewSet)
router.register(r'visitors', views.VisitorViewSet)
router.register(r'registrations', views.RegistrationViewSet)
router.register(r'clerks', views.ClerkViewSet)
router.register(r'setupstatuses', views.SetupStatusViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),

    # API Health Check
    path('api/health/', APIHealthCheckView.as_view(), name='api_health'),

    # Main API endpoints
    path('api/', include(router.urls)),

    # Authentication endpoints that match frontend expectations
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/logout/', LogoutView.as_view(), name='auth_logout'),
    
    # JWT token refresh
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # User management
    path('api/users/profile/', UserProfileView.as_view(), name='user_profile'),
    path('api/users/', UserListView.as_view(), name='user_list'),
    
    # Dashboard
    path('api/dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    
    # Exhibition specific endpoints
    path('api/exhibitions/<int:pk>/detail/', ExhibitionDetailView.as_view(), name='exhibition_detail'),
    path('api/exhibitions/<int:exhibition_id>/register/', ExhibitionRegistrationView.as_view(), name='exhibition_register'),
    
    # User-specific endpoints
    path('api/my/registrations/', MyRegistrationsView.as_view(), name='my_registrations'),
    
    # Artist specific endpoints
    path('api/artists/<int:pk>/detail/', ArtistDetailView.as_view(), name='artist_detail'),
    
    # visitor specific endpoints
    # Add this to your urlpatterns
    path('api/gallery/', PublicExhibitionListView.as_view(), name='public_gallery'),
    # Legacy endpoints (keep for backward compatibility)
    path('api/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh_legacy'),
    path('api/register/', RegisterView.as_view(), name='register_legacy'),
]