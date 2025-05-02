from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserFinancialProfileViewSet,
    CreditScoreHistoryViewSet,
    LoanAccountViewSet
)
from .health import health_check

# Create explicit URL patterns for the financial profile
urlpatterns = [
    # Health check endpoint (no authentication required)
    path('health/', health_check, name='health-check'),

    # Financial Profile Endpoints
    path('profile/', UserFinancialProfileViewSet.as_view({
        'get': 'list',
        'post': 'create',
        'put': 'update',
    })),
    path('profile/<int:pk>/', UserFinancialProfileViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy',
    })),
    path('calculate-credit-score/', UserFinancialProfileViewSet.as_view({
        'post': 'calculate_credit_score',
    })),

    # Use router for other endpoints
    path('', include(DefaultRouter().urls)),
]

# Add other viewsets to the router
router = DefaultRouter()
router.register(r'credit-history', CreditScoreHistoryViewSet, basename='credit-history')
router.register(r'loans', LoanAccountViewSet, basename='loans')

# Add router URLs to urlpatterns
urlpatterns += router.urls
