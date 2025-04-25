from django.urls import path
from .views import get_due_loans, update_loan_status

urlpatterns = [
    path("due-loans/", get_due_loans, name="get_due_loans"),
    path("update-loan/", update_loan_status, name="update_loan_status"),
]