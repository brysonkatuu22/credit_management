from rest_framework import serializers
from .models import LoanAccount

class LoanAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanAccount
        fields = ['id', 'account_number', 'lender_name', 'loan_amount', 'balance', 'interest_rate', 'start_date', 'end_date', 'status']
