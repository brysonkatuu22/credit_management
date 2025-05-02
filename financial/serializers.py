from rest_framework import serializers
from .models import UserFinancialProfile, CreditScoreHistory, LoanAccount


class UserFinancialProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserFinancialProfile
        exclude = ['user', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        """
        Convert incoming data to the correct types before validation.
        This handles cases where numbers are sent as strings.
        """
        # Make a copy of the data to avoid modifying the original
        processed_data = data.copy()

        # List of fields that should be converted to Decimal
        decimal_fields = [
            'income', 'employment_length', 'debt_to_income',
            'credit_utilization', 'payment_history', 'credit_mix',
            'new_credit', 'credit_history_length', 'loan_amount',
            'interest_rate', 'monthly_payment'
        ]

        # List of fields that should be converted to integers
        integer_fields = [
            'age', 'public_records', 'total_accounts', 'delinquent_accounts'
        ]

        # Convert string values to appropriate types
        for field in decimal_fields:
            if field in processed_data and processed_data[field] not in (None, ''):
                try:
                    # Convert to float first to handle scientific notation
                    processed_data[field] = float(processed_data[field])
                except (ValueError, TypeError):
                    # Keep original value if conversion fails, validation will catch it
                    pass

        for field in integer_fields:
            if field in processed_data and processed_data[field] not in (None, ''):
                try:
                    processed_data[field] = int(float(processed_data[field]))
                except (ValueError, TypeError):
                    # Keep original value if conversion fails, validation will catch it
                    pass

        # Call the parent method with our processed data
        return super().to_internal_value(processed_data)

    def validate(self, data):
        """
        Validate that financial data is within acceptable ranges.
        """
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Validating financial profile data: {data}")

        # Validate income (should be at least 300 Ksh)
        if 'income' in data and data['income'] is not None:
            if data['income'] < 300:
                raise serializers.ValidationError({"income": "Monthly income must be at least 300 Ksh"})

        # Validate debt_to_income ratio (should be between 0 and 1)
        if 'debt_to_income' in data and data['debt_to_income'] is not None:
            if data['debt_to_income'] < 0 or data['debt_to_income'] > 1:
                raise serializers.ValidationError({"debt_to_income": "Must be between 0 and 1"})

        # Validate credit_utilization (should be between 0 and 1)
        if 'credit_utilization' in data and data['credit_utilization'] is not None:
            if data['credit_utilization'] < 0 or data['credit_utilization'] > 1:
                raise serializers.ValidationError({"credit_utilization": "Must be between 0 and 1"})

        # Validate age (should be at least 18)
        if 'age' in data and data['age'] is not None:
            if data['age'] < 18:
                raise serializers.ValidationError({"age": "Must be at least 18 years old"})

        logger.info(f"Validation passed, returning data: {data}")
        return data

    def update(self, instance, validated_data):
        """
        Update and return an existing UserFinancialProfile instance.
        """
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Updating financial profile {instance.id} with data: {validated_data}")

        # Update all fields from validated_data
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Save the instance
        instance.save()
        logger.info(f"Profile updated successfully: {instance.id}")
        return instance


class CreditScoreHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditScoreHistory
        exclude = ['user']
        read_only_fields = ['calculation_date', 'score']


class LoanAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanAccount
        exclude = ['user', 'created_at', 'updated_at']
        read_only_fields = ['id']  # Make ID read-only

    def validate(self, data):
        """
        Validate loan account data.
        """
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Validating loan account data: {data}")

        # Validate that end_date is after start_date
        if 'start_date' in data and 'end_date' in data:
            if data['end_date'] <= data['start_date']:
                logger.warning(f"Invalid end_date: {data['end_date']} is not after start_date: {data['start_date']}")
                raise serializers.ValidationError({"end_date": "End date must be after start date"})

        # Validate interest rate (typically between 0% and 30%)
        if 'interest_rate' in data:
            if data['interest_rate'] < 0 or data['interest_rate'] > 30:
                logger.warning(f"Invalid interest_rate: {data['interest_rate']} is not between 0% and 30%")
                raise serializers.ValidationError({"interest_rate": "Interest rate should be between 0% and 30%"})

        # Validate principal amount (should be positive)
        if 'principal_amount' in data:
            if data['principal_amount'] <= 0:
                logger.warning(f"Invalid principal_amount: {data['principal_amount']} is not positive")
                raise serializers.ValidationError({"principal_amount": "Principal amount must be greater than zero"})

        # Validate remaining balance (should be non-negative)
        if 'remaining_balance' in data:
            if data['remaining_balance'] < 0:
                logger.warning(f"Invalid remaining_balance: {data['remaining_balance']} is negative")
                raise serializers.ValidationError({"remaining_balance": "Remaining balance cannot be negative"})

        # Validate monthly payment (should be positive for active loans)
        if 'monthly_payment' in data and 'is_active' in data:
            if data['is_active'] and data['monthly_payment'] <= 0:
                logger.warning(f"Invalid monthly_payment: {data['monthly_payment']} is not positive for active loan")
                raise serializers.ValidationError({"monthly_payment": "Monthly payment must be greater than zero for active loans"})

        # Validate term months (should be positive)
        if 'term_months' in data:
            if data['term_months'] <= 0:
                logger.warning(f"Invalid term_months: {data['term_months']} is not positive")
                raise serializers.ValidationError({"term_months": "Term months must be greater than zero"})

        logger.info("Loan data validation passed")
        return data

    def create(self, validated_data):
        """
        Create and return a new LoanAccount instance.
        """
        import logging
        logger = logging.getLogger(__name__)

        # Log the validated data
        logger.info(f"Creating loan with validated data: {validated_data}")

        # Create the loan
        loan = LoanAccount.objects.create(**validated_data)
        logger.info(f"Loan created with ID: {loan.id}")

        return loan
