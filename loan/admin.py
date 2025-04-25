from django.contrib import admin
from .models import LoanAccount

@admin.register(LoanAccount)
class LoanAccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'user', 'lender_name', 'loan_amount', 'balance', 'status', 'start_date', 'end_date')
    search_fields = ('account_number', 'lender_name', 'user__username')
    list_filter = ('status', 'lender_name')
