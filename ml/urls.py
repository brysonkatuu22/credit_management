from django.urls import path
from . import views

urlpatterns = [
    path('model-info/', views.model_info, name='model-info'),
    path('predict/', views.predict_credit_score, name='predict-credit-score'),
]
