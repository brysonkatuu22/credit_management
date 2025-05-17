from django.db import models
from django.conf import settings
from django.utils import timezone

class UserFinancialProfile(models.Model):
    """
    Stores user financial data for credit score calculation.
    This data can be updated by users and will be used for credit score predictions.
    """
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='financial_profile')

    # Basic financial information
    income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                help_text="Monthly income in Kenyan Shillings")
    age = models.PositiveIntegerField(null=True, blank=True)
    employment_length = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                          help_text="Years of employment")
    monthly_debt_payment = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                             help_text="Total monthly debt payments")
    total_credit_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                           help_text="Total credit limit across all accounts")
    current_credit_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                               help_text="Current total balance on all credit accounts")

    # Credit-related metrics
    debt_to_income = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                       help_text="Debt-to-income ratio (0.0-1.0)")
    credit_utilization = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                           help_text="Credit utilization ratio (0.0-1.0)")
    payment_history = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                        help_text="Payment history score (0.0-1.0)")
    credit_mix = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                   help_text="Credit mix score (0.0-1.0)")
    new_credit = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                   help_text="New credit score (0.0-1.0)")
    credit_history_length = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                              help_text="Length of credit history in years")
    public_records = models.PositiveIntegerField(default=0,
                                               help_text="Number of public records")

    # Additional financial metrics
    loan_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True,
                                    help_text="Total loan amount")
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                      help_text="Average interest rate")
    monthly_payment = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                        help_text="Total monthly payment")
    total_accounts = models.PositiveIntegerField(default=0,
                                               help_text="Total number of accounts")
    delinquent_accounts = models.PositiveIntegerField(default=0,
                                                    help_text="Number of delinquent accounts")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Financial Profile for {self.user.email}"

    def is_complete(self):
        """Check if the profile has all required fields for credit scoring."""
        required_fields = [
            'income', 'age', 'employment_length', 'monthly_debt_payment',
            'payment_history', 'credit_history_length', 'public_records'
        ]

        # These fields are calculated automatically if the required fields are present
        calculated_fields = [
            'debt_to_income', 'credit_utilization'
        ]

        # Check required fields
        for field in required_fields:
            if getattr(self, field) is None:
                return False

        # For credit utilization, we need both total_credit_limit and current_credit_balance
        if self.credit_utilization is None:
            if self.total_credit_limit is None or self.current_credit_balance is None:
                return False

        return True


class CreditScoreHistory(models.Model):
    """
    Stores historical credit scores for users to track changes over time.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='credit_scores')
    score = models.PositiveIntegerField(help_text="Credit score (300-850)")
    calculation_date = models.DateTimeField(default=timezone.now)

    # Store the financial data snapshot used for this calculation
    income = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    age = models.PositiveIntegerField(null=True)
    employment_length = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    monthly_debt_payment = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    total_credit_limit = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    current_credit_balance = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    debt_to_income = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    credit_utilization = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    payment_history = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    credit_mix = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    new_credit = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    credit_history_length = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    public_records = models.PositiveIntegerField(null=True)

    class Meta:
        ordering = ['-calculation_date']

    def __str__(self):
        return f"Credit Score: {self.score} for {self.user.email} on {self.calculation_date.strftime('%Y-%m-%d')}"


class LoanAccount(models.Model):
    """
    Stores information about user loan accounts.
    """
    LOAN_TYPES = (
        ('personal', 'Personal Loan'),
        ('mortgage', 'Mortgage'),
        ('auto', 'Auto Loan'),
        ('student', 'Student Loan'),
        ('credit_card', 'Credit Card'),
        ('other', 'Other'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='loans')
    loan_type = models.CharField(max_length=20, choices=LOAN_TYPES)
    lender = models.CharField(max_length=100)
    principal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    term_months = models.PositiveIntegerField()
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_payment = models.DecimalField(max_digits=10, decimal_places=2)
    remaining_balance = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_loan_type_display()} - {self.lender} (Ksh {self.principal_amount})"
