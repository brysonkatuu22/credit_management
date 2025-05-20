from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import RegisterView, SentimentAnalysisAPIView, SentimentDashboardAPIView, SentimentTrendAnalysisAPIView, SentimentRiskAnalysisAPIView

print("✅ users/urls.py has been loaded")


urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", TokenObtainPairView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("sentiment-analysis/", SentimentAnalysisAPIView.as_view(), name="sentiment-analysis"),
    path("sentiment-dashboard/", SentimentDashboardAPIView.as_view(), name="sentiment-dashboard"),
    path("sentiment-trend-analysis/", SentimentTrendAnalysisAPIView.as_view(), name="sentiment-trend-analysis"),
    path("sentiment-risk-analysis/", SentimentRiskAnalysisAPIView.as_view(), name="sentiment-risk-analysis"),
]
