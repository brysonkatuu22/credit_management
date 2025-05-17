from django.contrib import admin
from .models import UserFinancialProfile, CreditScoreHistory, LoanAccount

@admin.register(UserFinancialProfile)
class UserFinancialProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'income', 'age', 'employment_length', 'debt_to_income', 'credit_utilization')
    search_fields = ('user__email', 'user__username')
    list_filter = ('created_at',)

@admin.register(CreditScoreHistory)
class CreditScoreHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'score', 'calculation_date')
    search_fields = ('user__email', 'user__username')
    list_filter = ('calculation_date',)

@admin.register(LoanAccount)
class LoanAccountAdmin(admin.ModelAdmin):
    list_display = ('user', 'loan_type', 'lender', 'principal_amount', 'remaining_balance',
                   'interest_rate', 'start_date', 'end_date', 'is_active')
    search_fields = ('user__email', 'lender')
    list_filter = ('loan_type', 'is_active', 'created_at')
