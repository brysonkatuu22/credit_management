from django.urls import path
from .views import LoanAccountListView
from .views import due_loans

urlpatterns = [
    path('accounts/', LoanAccountListView.as_view(), name='loan-accounts-list'),
        
]
