# loan/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class LoanAccount(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="loan_accounts")
    account_number = models.CharField(max_length=20, unique=True)
    lender_name = models.CharField(max_length=100)  # Lender's name
    loan_amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    interest_rate = models.FloatField()
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('closed', 'Closed'),
            ('defaulted', 'Defaulted')
        ],
        default='active'
    )

    def __str__(self):
        return f"{self.account_number} - {self.lender_name} - {self.user.username}"
