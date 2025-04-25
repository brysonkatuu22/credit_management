from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from loan.models import LoanAccount
from django.utils.timezone import now
from datetime import timedelta


@api_view(["GET"])
def get_due_loans(request):
    today = now().date()
    due_loans = LoanAccount.objects.filter(end_date__range=[today, today + timedelta(days=7)])
    overdue_loans = LoanAccount.objects.filter(end_date__lt=today)

    loans_data = {
        "due_soon": [{"user": loan.user.email, "lender": loan.lender_name, "due_date": loan.end_date} for loan in due_loans],
        "overdue": [{"user": loan.user.email, "lender": loan.lender_name, "due_date": loan.end_date} for loan in overdue_loans]
    }
    return Response(loans_data)

@api_view(["POST"])
def update_loan_status(request):
    loan_id = request.data.get("loan_id")
    new_status = request.data.get("status")

    try:
        loan = LoanAccount.objects.get(id=loan_id)
        loan.status = new_status
        loan.save()
        return Response({"message": "Loan status updated"})
    except LoanAccount.DoesNotExist:
        return Response({"error": "Loan not found"}, status=404)

