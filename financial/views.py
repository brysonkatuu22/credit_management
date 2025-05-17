from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
import logging

from .models import UserFinancialProfile, CreditScoreHistory, LoanAccount
from .serializers import (
    UserFinancialProfileSerializer,
    CreditScoreHistorySerializer,
    LoanAccountSerializer
)

# Import the credit score model
from ml.credit_score_model import CreditScoreModel
from pathlib import Path
import numpy as np

# Configure logging
logger = logging.getLogger(__name__)

# Load the credit score model
CREDIT_MODEL = None

def load_credit_model():
    global CREDIT_MODEL
    if CREDIT_MODEL is not None:
        return CREDIT_MODEL

    try:
        # Try to load the robust model from ml/models directory
        MODEL_PATH = Path(__file__).resolve().parent.parent / 'ml' / 'models' / 'robust_credit_score_model.pkl'
        if MODEL_PATH.exists():
            try:
                CREDIT_MODEL = CreditScoreModel.load_model(str(MODEL_PATH))
                if CREDIT_MODEL:
                    logger.info("Robust credit score model loaded successfully.")
                    return CREDIT_MODEL
            except Exception as e:
                logger.error(f"Error loading robust model: {e}")

        # Try to load the new model as fallback
        NEW_MODEL_PATH = Path(__file__).resolve().parent.parent / 'ml' / 'models' / 'new_credit_score_model.pkl'
        if NEW_MODEL_PATH.exists():
            try:
                CREDIT_MODEL = CreditScoreModel.load_model(str(NEW_MODEL_PATH))
                if CREDIT_MODEL:
                    logger.info("Fallback to new credit score model successful.")
                    return CREDIT_MODEL
            except Exception as e:
                logger.error(f"Error loading new model: {e}")

        # Try to load the original model as second fallback
        ORIGINAL_MODEL_PATH = Path(__file__).resolve().parent.parent / 'ml' / 'models' / 'credit_score_model.pkl'
        if ORIGINAL_MODEL_PATH.exists():
            try:
                CREDIT_MODEL = CreditScoreModel.load_model(str(ORIGINAL_MODEL_PATH))
                if CREDIT_MODEL:
                    logger.info("Fallback to original credit score model successful.")
                    return CREDIT_MODEL
            except Exception as e:
                logger.error(f"Error loading original model: {e}")

        # If all models fail to load, create a dummy model
        logger.warning("All model loading attempts failed. Creating a dummy model.")
        CREDIT_MODEL = DummyCreditScoreModel()
        return CREDIT_MODEL
    except Exception as e:
        logger.error(f"Error loading any credit score model: {e}")
        # Return a dummy model as last resort
        CREDIT_MODEL = DummyCreditScoreModel()
        return CREDIT_MODEL

# Dummy model that doesn't require any ML libraries
class DummyCreditScoreModel:
    def __init__(self):
        logger.info("Initializing DummyCreditScoreModel (fallback calculator)...")

    def predict(self, X):
        logger.info("Using fallback prediction logic...")
        try:
            # This is a simplified version of the credit score calculation
            # that doesn't require any ML libraries
            if len(X) == 0 or len(X[0]) == 0:
                logger.warning("Empty input data for fallback prediction. Using default score.")
                return [650]

            # Extract features from input data (assuming standard order)
            # The order should match what's used in the real model
            features = X[0]

            # Base score starts at 500
            base_score = 500

            # Add score based on payment history (typically 35% of score weight)
            # Assuming payment_history is the first feature
            if len(features) > 0:
                payment_history = features[0]
                payment_score = payment_history * 100  # Scale from 0-1 to 0-100
                base_score += payment_score

            # Add score based on credit utilization (typically 30% of score weight)
            # Assuming credit_utilization is the second feature
            if len(features) > 1:
                credit_utilization = features[1]
                # Lower utilization is better
                utilization_score = (1 - credit_utilization) * 80
                base_score += utilization_score

            # Add score based on credit history length (typically 15% of score weight)
            # Assuming credit_history_length is the third feature
            if len(features) > 2:
                credit_history_length = features[2]
                history_score = min(credit_history_length * 10, 50)  # Cap at 50 points
                base_score += history_score

            # Add score based on income (not a traditional factor but relevant)
            # Assuming income is somewhere in the features
            if len(features) > 3:
                income = features[3]
                income_score = min(income / 10000, 30)  # Cap at 30 points
                base_score += income_score

            # Ensure score is within valid range (300-850)
            final_score = max(300, min(850, int(base_score)))
            logger.info(f"Fallback calculation produced score: {final_score}")

            return [final_score]
        except Exception as e:
            logger.error(f"Error in fallback prediction: {e}")
            # If anything goes wrong, return a default score
            return [650]

# Try to load the model at startup
try:
    CREDIT_MODEL = load_credit_model()
except Exception as e:
    logger.error(f"Failed to load credit model at startup: {e}")


class UserFinancialProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing user financial profiles.
    """
    serializer_class = UserFinancialProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This view returns the financial profile for the currently authenticated user.
        """
        return UserFinancialProfile.objects.filter(user=self.request.user)

    def create(self, request):
        """
        Create a new financial profile for the user.
        If a profile already exists, it will be updated instead.
        """
        logger.info(f"Creating/updating financial profile for user {request.user.id}")
        logger.info(f"Data: {request.data}")

        # Process numeric fields to ensure they fit within database constraints
        processed_data = {}
        for key, value in request.data.items():
            if value is None:
                processed_data[key] = value
                continue

            # Handle numeric fields
            if key in ['debt_to_income', 'credit_utilization', 'payment_history',
                      'credit_mix', 'new_credit', 'credit_history_length', 'interest_rate']:
                # These fields have max_digits=5, decimal_places=2
                try:
                    float_value = float(value)
                    # Cap at appropriate values and round to 2 decimal places
                    if key in ['debt_to_income', 'credit_utilization']:
                        float_value = min(float_value, 1.0)
                    processed_data[key] = round(float_value, 2)
                    logger.info(f"Processed {key}: {value} -> {processed_data[key]}")
                except (ValueError, TypeError) as e:
                    logger.error(f"Error processing {key}: {e}")
                    # Skip this field
                    continue
            else:
                # For other fields, just pass the value as is
                processed_data[key] = value

        # Check if profile already exists
        try:
            profile = UserFinancialProfile.objects.get(user=request.user)
            logger.info(f"Existing profile found: {profile.id}, updating it")

            # Update existing profile
            serializer = self.get_serializer(profile, data=processed_data, partial=True)
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Profile updated successfully: {profile.id}")
                return Response(serializer.data)
            else:
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except UserFinancialProfile.DoesNotExist:
            logger.info(f"No existing profile found for user {request.user.id}, creating new one")

            # Create new profile
            serializer = self.get_serializer(data=processed_data)
            if serializer.is_valid():
                serializer.save(user=request.user)
                logger.info(f"New profile created successfully")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            logger.error(f"Error creating/updating profile: {e}", exc_info=True)
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def perform_create(self, serializer):
        """
        Create a new financial profile for the user.
        """
        serializer.save(user=self.request.user)

    def list(self, request):
        """
        Return the user's financial profile or create a new one if it doesn't exist.
        """
        try:
            profile = UserFinancialProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserFinancialProfile.DoesNotExist:
            # Return empty profile data
            return Response({
                "message": "No financial profile found. Please create one."
            }, status=status.HTTP_404_NOT_FOUND)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve the user's financial profile.
        """
        # Ignore the pk in the URL and always return the current user's profile
        try:
            profile = UserFinancialProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserFinancialProfile.DoesNotExist:
            return Response({
                "message": "No financial profile found. Please create one."
            }, status=status.HTTP_404_NOT_FOUND)

    def update(self, request, *args, **kwargs):
        """
        Update the user's financial profile.
        """
        # Ignore the pk in the URL and always update the current user's profile
        logger.info(f"Updating financial profile for user {request.user.id}")
        logger.info(f"Update data: {request.data}")

        # Process numeric fields to ensure they fit within database constraints
        processed_data = {}
        for key, value in request.data.items():
            if value is None:
                processed_data[key] = value
                continue

            # Handle numeric fields
            if key in ['debt_to_income', 'credit_utilization', 'payment_history',
                      'credit_mix', 'new_credit', 'credit_history_length', 'interest_rate']:
                # These fields have max_digits=5, decimal_places=2
                try:
                    float_value = float(value)
                    # Cap at appropriate values and round to 2 decimal places
                    if key in ['debt_to_income', 'credit_utilization']:
                        float_value = min(float_value, 1.0)
                    processed_data[key] = round(float_value, 2)
                    logger.info(f"Processed {key}: {value} -> {processed_data[key]}")
                except (ValueError, TypeError) as e:
                    logger.error(f"Error processing {key}: {e}")
                    # Skip this field
                    continue
            else:
                # For other fields, just pass the value as is
                processed_data[key] = value

        try:
            profile = UserFinancialProfile.objects.get(user=request.user)
            serializer = self.get_serializer(profile, data=processed_data, partial=True)

            if serializer.is_valid():
                serializer.save()
                logger.info(f"Profile updated successfully: {profile.id}")
                return Response(serializer.data)
            else:
                logger.error(f"Validation errors in profile update: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except UserFinancialProfile.DoesNotExist:
            # Create a new profile if it doesn't exist
            logger.info(f"No existing profile found for user {request.user.id}, creating new one")
            serializer = self.get_serializer(data=processed_data)

            if serializer.is_valid():
                serializer.save(user=request.user)
                logger.info(f"New profile created for user {request.user.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                logger.error(f"Validation errors in profile creation: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def calculate_credit_score(self, request):
        """
        Calculate credit score based on the user's financial profile.
        """
        global CREDIT_MODEL
        try:
            # Try to load the model if it's not already loaded
            if CREDIT_MODEL is None:
                logger.info("Attempting to load credit scoring model...")
                CREDIT_MODEL = load_credit_model()
                if CREDIT_MODEL is not None:
                    logger.info("Credit scoring model loaded successfully")
                else:
                    logger.warning("Credit scoring model could not be loaded")

            # If still None after trying to load, use a fallback calculation
            if CREDIT_MODEL is None:
                logger.warning("Credit scoring model is not available. Using fallback calculation.")
                CREDIT_MODEL = DummyCreditScoreModel()
                logger.info("Initialized DummyCreditScoreModel as fallback")
        except Exception as e:
            import traceback
            error_traceback = traceback.format_exc()
            logger.error(f"Error loading credit model during calculation: {e}")
            logger.error(f"Traceback: {error_traceback}")

            # Instead of returning an error, use the fallback model
            logger.warning("Using fallback credit score calculation due to model loading error.")
            CREDIT_MODEL = DummyCreditScoreModel()
            logger.info("Initialized DummyCreditScoreModel as fallback after error")

        try:
            # Get user's financial profile
            profile = get_object_or_404(UserFinancialProfile, user=request.user)

            # Get the data from the request
            data = request.data

            # Check if we have all required fields in the request
            required_fields = ['income', 'age', 'employment_length', 'payment_history', 'credit_history_length']
            missing_fields = [field for field in required_fields if field not in data or data[field] is None]

            if missing_fields:
                return Response({
                    "error": f"Missing required fields: {', '.join(missing_fields)}. Please fill in all required fields."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update the profile with the new data
            for key, value in data.items():
                if hasattr(profile, key) and value is not None:
                    # For credit_utilization, ensure it's within the valid range and format
                    if key == 'credit_utilization':
                        # Convert to float, cap at 1.0 (100%), and format to 2 decimal places
                        try:
                            float_value = float(value)
                            # Cap at 1.0 (100%)
                            float_value = min(float_value, 1.0)
                            # Format to 2 decimal places to ensure it fits in the database field
                            value = round(float_value, 2)
                            logger.info(f"Credit utilization processed: {value}")
                        except (ValueError, TypeError) as e:
                            logger.error(f"Error processing credit utilization: {e}")
                            # Default to 0.5 (50%) if there's an error
                            value = 0.5

                    # For debt_to_income, ensure it's within the valid range and format
                    if key == 'debt_to_income':
                        try:
                            float_value = float(value)
                            # Cap at 1.0 (100%)
                            float_value = min(float_value, 1.0)
                            # Format to 2 decimal places to ensure it fits in the database field
                            value = round(float_value, 2)
                            logger.info(f"Debt-to-income ratio processed: {value}")
                        except (ValueError, TypeError) as e:
                            logger.error(f"Error processing debt-to-income ratio: {e}")
                            # Default to 0.3 (30%) if there's an error
                            value = 0.3

                    setattr(profile, key, value)

            # Save the updated profile
            profile.save()

            # Calculate credit score using a more realistic formula
            # This ensures scores vary logically based on user inputs

            # Extract values from the request data for easier reference
            income = float(data.get('income', profile.income))
            age = float(data.get('age', profile.age))
            employment_length = float(data.get('employment_length', profile.employment_length))
            debt_to_income = float(data.get('debt_to_income', profile.debt_to_income or 0))
            credit_utilization = float(data.get('credit_utilization', profile.credit_utilization or 0))
            payment_history = float(data.get('payment_history', profile.payment_history))
            credit_mix = float(data.get('credit_mix', profile.credit_mix or 0.5))
            credit_history_length = float(data.get('credit_history_length', profile.credit_history_length))
            public_records = float(data.get('public_records', profile.public_records or 0))
            delinquent_accounts = float(data.get('delinquent_accounts', profile.delinquent_accounts or 0))
            total_accounts = float(data.get('total_accounts', profile.total_accounts or 1))
            monthly_debt_payment = float(data.get('monthly_debt_payment', profile.monthly_debt_payment or 0))

            # Start with a lower base score to make it harder to get a good score with poor habits
            base_score = 450  # Lowered from 550

            # Log the input data for debugging
            logger.info(f"Credit score calculation input data for user {request.user.id}:")
            logger.info(f"Income: {income}")
            logger.info(f"Age: {age}")
            logger.info(f"Employment length: {employment_length}")
            logger.info(f"Debt-to-income: {debt_to_income}")
            logger.info(f"Credit utilization: {credit_utilization}")
            logger.info(f"Payment history: {payment_history}")
            logger.info(f"Credit mix: {credit_mix}")
            logger.info(f"Credit history length: {credit_history_length}")
            logger.info(f"Public records: {public_records}")
            logger.info(f"Delinquent accounts: {delinquent_accounts}")
            logger.info(f"Total accounts: {total_accounts}")
            logger.info(f"Monthly debt payment: {monthly_debt_payment}")

            # ===== PAYMENT HISTORY (35% of score) =====
            # Payment history is the most important factor
            # Scale: 0-297.5 points (35% of 850 max score)
            # Perfect payment history (1.0) gives full points
            # Each reduction is more severely penalized
            if payment_history >= 0.99:  # Excellent
                payment_score = 297.5
            elif payment_history >= 0.97:  # Very Good
                payment_score = 270  # Reduced from 280
            elif payment_history >= 0.94:  # Good
                payment_score = 230  # Reduced from 250
            elif payment_history >= 0.90:  # Fair
                payment_score = 180  # Reduced from 210
            elif payment_history >= 0.85:  # Poor
                payment_score = 130  # Reduced from 170
            elif payment_history >= 0.80:  # Very Poor
                payment_score = 90   # Reduced from 130
            else:  # Terrible
                payment_score = max(50, payment_history * 80)  # More severe penalty (was 80, payment_history * 100)

            # ===== CREDIT UTILIZATION (30% of score) =====
            # Credit utilization is the second most important factor
            # Scale: 0-255 points (30% of 850 max score)
            # Lower utilization is better, with much sharper penalties above 30%
            if credit_utilization <= 0.1:  # Excellent: 0-10%
                utilization_score = 255
            elif credit_utilization <= 0.2:  # Very Good: 10-20%
                utilization_score = 225  # Reduced from 235
            elif credit_utilization <= 0.3:  # Good: 20-30%
                utilization_score = 190  # Reduced from 210
            elif credit_utilization <= 0.5:  # Fair: 30-50%
                utilization_score = 140  # Reduced from 170
            elif credit_utilization <= 0.7:  # Poor: 50-70%
                utilization_score = 90   # Reduced from 130
            elif credit_utilization <= 0.9:  # Very Poor: 70-90%
                utilization_score = 50   # Reduced from 90
            else:  # Terrible: 90-100%
                utilization_score = 20   # Reduced from 50

            # ===== CREDIT HISTORY LENGTH (15% of score) =====
            # Credit history length is important for establishing credit
            # Scale: 0-127.5 points (15% of 850 max score)
            # Longer history is better, with diminishing returns after 7 years
            if credit_history_length >= 7:  # Excellent: 7+ years
                history_score = 127.5
            elif credit_history_length >= 5:  # Very Good: 5-7 years
                history_score = 115
            elif credit_history_length >= 3:  # Good: 3-5 years
                history_score = 100
            elif credit_history_length >= 2:  # Fair: 2-3 years
                history_score = 85
            elif credit_history_length >= 1:  # Poor: 1-2 years
                history_score = 70
            else:  # Very Poor: <1 year
                history_score = 50

            # ===== CREDIT MIX (10% of score) =====
            # Having different types of credit shows responsibility
            # Scale: 0-85 points (10% of 850 max score)
            # Higher mix score is better
            if credit_mix >= 0.8:  # Excellent
                mix_score = 85
            elif credit_mix >= 0.6:  # Good
                mix_score = 70
            elif credit_mix >= 0.4:  # Fair
                mix_score = 55
            elif credit_mix >= 0.2:  # Poor
                mix_score = 40
            else:  # Very Poor
                mix_score = 25

            # ===== DEBT-TO-INCOME RATIO (10% of score) - Increased importance =====
            # Lower DTI is better for creditworthiness
            # Scale: 0-85 points (10% of 850 max score) - Doubled from 5% to 10%
            if debt_to_income <= 0.2:  # Excellent: 0-20%
                dti_score = 85  # Doubled from 42.5
            elif debt_to_income <= 0.36:  # Good: 20-36%
                dti_score = 65  # Increased from 35
            elif debt_to_income <= 0.43:  # Fair: 36-43%
                dti_score = 40  # Increased from 25
            elif debt_to_income <= 0.5:  # Poor: 43-50%
                dti_score = 20  # Increased from 15
            else:  # Very Poor: >50%
                dti_score = 0   # Reduced from 5 - No points for very poor DTI

            # ===== PUBLIC RECORDS (10% of score) - Increased importance =====
            # Public records like bankruptcies severely impact score
            # Scale: -50 to 85 points (10% of 850 max score plus penalty) - Doubled from 5% to 10%
            if public_records == 0:  # Excellent: No public records
                public_records_score = 85  # Doubled from 42.5
            elif public_records == 1:  # Poor: 1 public record
                public_records_score = -25  # Changed from 10 to negative 25 (penalty)
            else:  # Very Poor: 2+ public records
                public_records_score = -50  # Changed from 0 to negative 50 (severe penalty)

            # ===== TOTAL ACCOUNTS & CREDIT MIX BONUS =====
            # Having a good number of accounts shows credit experience
            # Scale: 0-20 points bonus
            if total_accounts >= 4 and total_accounts <= 10:
                total_accounts_score = 20  # Ideal range
            elif total_accounts > 10:
                total_accounts_score = 15  # Too many accounts
            elif total_accounts >= 2:
                total_accounts_score = 10  # Few accounts
            else:
                total_accounts_score = 0  # Too few accounts

            # ===== DELINQUENT ACCOUNTS PENALTY =====
            # Delinquent accounts severely impact score
            # Scale: 0 to -150 points penalty - Increased severity
            if delinquent_accounts == 0:
                delinquent_score = 0  # No penalty
            elif delinquent_accounts == 1:
                delinquent_score = -75  # Increased from -40 - Severe penalty
            elif delinquent_accounts == 2:
                delinquent_score = -120  # Increased from -70 - Major penalty
            else:
                delinquent_score = -150  # Increased from -100 - Extreme penalty

            # ===== INCOME CONSIDERATION =====
            # Higher income relative to debt is better
            # Scale: -30 to 40 points (bonus or penalty) - Increased impact
            if income > 0:
                # Calculate debt-to-income ratio based on monthly values
                monthly_income = income
                debt_payment_ratio = monthly_debt_payment / monthly_income if monthly_income > 0 else 1

                if debt_payment_ratio <= 0.1:  # Excellent: <10% of income to debt
                    income_score = 40  # Doubled from 20
                elif debt_payment_ratio <= 0.2:  # Good: 10-20% of income to debt
                    income_score = 30  # Doubled from 15
                elif debt_payment_ratio <= 0.3:  # Fair: 20-30% of income to debt
                    income_score = 15  # Increased from 10
                elif debt_payment_ratio <= 0.4:  # Poor: 30-40% of income to debt
                    income_score = 0   # Reduced from 5 - No bonus
                elif debt_payment_ratio <= 0.5:  # Very Poor: 40-50% of income to debt
                    income_score = -15  # Changed to penalty
                else:  # Extremely Poor: >50% of income to debt
                    income_score = -30  # Severe penalty
            else:
                income_score = -10  # Penalty for no income (was 0)

            # ===== EMPLOYMENT LENGTH CONSIDERATION =====
            # Longer employment shows stability
            # Scale: 0-20 points bonus
            if employment_length >= 5:  # Excellent: 5+ years
                employment_score = 20
            elif employment_length >= 3:  # Good: 3-5 years
                employment_score = 15
            elif employment_length >= 1:  # Fair: 1-3 years
                employment_score = 10
            elif employment_length >= 0.5:  # Poor: 6 months - 1 year
                employment_score = 5
            else:  # Very Poor: <6 months
                employment_score = 0

            # ===== AGE CONSIDERATION =====
            # Age itself isn't a direct factor but correlates with experience
            # Scale: 0-10 points bonus
            if age >= 30:  # Mature credit user
                age_score = 10
            elif age >= 25:  # Young adult
                age_score = 7
            elif age >= 21:  # New adult
                age_score = 5
            else:  # Very young
                age_score = 2

            # Calculate final score with all components
            predicted_score = int(base_score +
                                payment_score +
                                utilization_score +
                                history_score +
                                mix_score +
                                dti_score +
                                public_records_score +
                                total_accounts_score +
                                delinquent_score +  # This is a penalty (negative)
                                income_score +
                                employment_score +
                                age_score)

            # Ensure score is within valid range (300-850)
            predicted_score = max(300, min(850, predicted_score))

            # Log the calculation components for debugging
            logger.info(f"Credit score calculation for user {request.user.id}:")
            logger.info(f"Base score: {base_score} (lowered to make poor habits more impactful)")
            logger.info(f"Payment history ({payment_history:.2f}): {payment_score:.2f} (35% weight)")
            logger.info(f"Credit utilization ({credit_utilization:.2f}): {utilization_score:.2f} (30% weight)")
            logger.info(f"Credit history length ({credit_history_length:.2f} years): {history_score:.2f} (15% weight)")
            logger.info(f"Credit mix ({credit_mix:.2f}): {mix_score:.2f} (10% weight)")
            logger.info(f"Debt-to-income ratio ({debt_to_income:.2f}): {dti_score:.2f} (10% weight - increased)")
            logger.info(f"Public records ({public_records:.0f}): {public_records_score:.2f} (10% weight - increased)")
            logger.info(f"Total accounts ({total_accounts:.0f}): {total_accounts_score:.2f} (bonus)")
            logger.info(f"Delinquent accounts ({delinquent_accounts:.0f}): {delinquent_score:.2f} (increased penalty)")
            logger.info(f"Income-to-debt ratio: {income_score:.2f} (bonus/penalty - increased impact)")
            logger.info(f"Employment length ({employment_length:.2f} years): {employment_score:.2f} (bonus)")
            logger.info(f"Age ({age:.0f}): {age_score:.2f} (bonus)")
            logger.info(f"Final score: {predicted_score} (range: 300-850)")

            # Determine credit score category and message
            category = ""
            message = ""

            if predicted_score >= 800:
                category = "Exceptional"
                message = (
                    "Your credit score is exceptional (800-850)! You're in the top tier of borrowers. "
                    "You're likely to get approved for the best loans with the lowest interest rates available. "
                    "Lenders see you as an extremely low-risk borrower. Continue your excellent credit habits to maintain this elite status."
                )
            elif predicted_score >= 740:
                category = "Excellent"
                message = (
                    "Your credit score is excellent (740-799). You have demonstrated very responsible credit management. "
                    "You should qualify for most loans with very competitive rates. "
                    "Lenders consider you a very low-risk borrower. Minor improvements could push you into the exceptional range."
                )
            elif predicted_score >= 670:
                category = "Good"
                message = (
                    "Your credit score is good (670-739). You've shown responsible credit management overall. "
                    "You should qualify for most loans with decent interest rates, though not the very best available. "
                    "Lenders see you as a relatively low-risk borrower. Focus on the factors listed below to improve your score further."
                )
            elif predicted_score >= 580:
                category = "Fair"
                message = (
                    "Your credit score is fair (580-669). You have some issues in your credit history that need attention. "
                    "You may face higher interest rates or have difficulty getting approved for some loans. "
                    "Lenders consider you a medium-risk borrower. Pay special attention to the improvement factors listed below."
                )
            elif predicted_score >= 500:
                category = "Poor"
                message = (
                    "Your credit score is poor (500-579). You have significant issues in your credit history. "
                    "You'll likely face high interest rates and may be denied for many types of credit. "
                    "Lenders see you as a high-risk borrower. Focus on addressing the negative factors listed below to improve your score."
                )
            else:
                category = "Very Poor"
                message = (
                    "Your credit score is very poor (300-499). You have serious issues in your credit history that require immediate attention. "
                    "You'll face significant challenges obtaining new credit and will likely need secured credit products. "
                    "Lenders consider you an extremely high-risk borrower. Consider credit counseling and focus on the improvement factors below."
                )

            # Identify key factors affecting the score
            factors = []

            # Payment history factors (most important)
            if payment_history >= 0.99:
                factors.append("Excellent payment history: You have a perfect or near-perfect payment record, which significantly boosts your score.")
            elif payment_history >= 0.94:
                factors.append("Good payment history: You have a strong payment record with few late payments.")
            elif payment_history >= 0.85:
                factors.append("Fair payment history: You have some late payments that are affecting your score. Focus on making all payments on time.")
            else:
                factors.append("Poor payment history: Your payment history shows multiple late payments or defaults. This is severely impacting your score. Make all future payments on time.")

            # Credit utilization factors (second most important)
            if credit_utilization <= 0.1:
                factors.append("Excellent credit utilization: You're using less than 10% of your available credit, which is ideal.")
            elif credit_utilization <= 0.3:
                factors.append("Good credit utilization: You're keeping your credit usage below 30%, which is recommended.")
            elif credit_utilization <= 0.5:
                factors.append("High credit utilization: You're using more than 30% of your available credit. Try to pay down balances to improve your score.")
            else:
                factors.append("Very high credit utilization: You're using more than 50% of your available credit. This is significantly lowering your score. Focus on reducing your balances.")

            # Credit history length factors
            if credit_history_length >= 7:
                factors.append("Excellent credit history length: Your credit history of 7+ years demonstrates long-term credit management.")
            elif credit_history_length >= 3:
                factors.append("Good credit history length: Your credit history of 3+ years is solid but will improve with time.")
            else:
                factors.append("Short credit history: Your credit history is less than 3 years, which limits your score. This will naturally improve over time.")

            # Debt-to-income factors
            if debt_to_income <= 0.2:
                factors.append("Excellent debt-to-income ratio: Your monthly debt payments are less than 20% of your income.")
            elif debt_to_income <= 0.36:
                factors.append("Good debt-to-income ratio: Your monthly debt payments are within the recommended range (20-36% of income).")
            elif debt_to_income <= 0.43:
                factors.append("High debt-to-income ratio: Your monthly debt payments are between 36-43% of your income, which may concern lenders.")
            else:
                factors.append("Very high debt-to-income ratio: Your monthly debt payments exceed 43% of your income. This significantly impacts your creditworthiness. Consider reducing debt or increasing income.")

            # Public records factors
            if public_records == 0:
                factors.append("No public records: You have no bankruptcies, tax liens, or judgments on your record.")
            else:
                factors.append(f"Public records present: You have {int(public_records)} public record(s) (bankruptcies, tax liens, or judgments) which severely impact your score.")

            # Delinquent accounts factors
            if delinquent_accounts == 0:
                factors.append("No delinquent accounts: You have no accounts that are currently past due.")
            else:
                factors.append(f"Delinquent accounts: You have {int(delinquent_accounts)} account(s) that are currently past due. This is severely impacting your score. Bring these accounts current as soon as possible.")

            # Account mix factors
            if total_accounts >= 4:
                if credit_mix >= 0.6:
                    factors.append("Good credit mix: You have a healthy mix of different types of credit accounts.")
                else:
                    factors.append("Limited credit mix: Consider diversifying your credit types (e.g., credit cards, installment loans, mortgage) to improve your score.")
            else:
                factors.append("Few accounts: Having only a few credit accounts limits your credit mix. Consider adding different types of credit over time.")

            # Employment factors
            if employment_length < 1:
                factors.append("Short employment history: Your employment length of less than 1 year may impact your creditworthiness. Longer employment demonstrates stability.")

            # Income factors
            if income > 0 and monthly_debt_payment > 0:
                debt_payment_ratio = monthly_debt_payment / income
                if debt_payment_ratio > 0.3:
                    factors.append(f"High debt payment ratio: Your monthly debt payments are {(debt_payment_ratio * 100):.1f}% of your income. Reducing this ratio will improve your creditworthiness.")

            # Save the credit score to history
            CreditScoreHistory.objects.create(
                user=request.user,
                score=predicted_score,
                income=profile.income,
                age=profile.age,
                employment_length=profile.employment_length,
                monthly_debt_payment=profile.monthly_debt_payment,
                total_credit_limit=profile.total_credit_limit,
                current_credit_balance=profile.current_credit_balance,
                debt_to_income=profile.debt_to_income,
                credit_utilization=profile.credit_utilization,
                payment_history=profile.payment_history,
                credit_mix=profile.credit_mix,
                new_credit=profile.new_credit,
                credit_history_length=profile.credit_history_length,
                public_records=profile.public_records
            )

            # Include financial data in the response for the frontend to display
            financial_data = {
                'payment_history': float(profile.payment_history),
                'credit_utilization': float(profile.credit_utilization),
                'credit_history_length': float(profile.credit_history_length),
                'credit_mix': float(profile.credit_mix),
                'debt_to_income': float(profile.debt_to_income),
                'public_records': int(profile.public_records),
                'delinquent_accounts': int(profile.delinquent_accounts),
                'total_accounts': int(profile.total_accounts),
                'income': float(profile.income),
                'monthly_debt_payment': float(profile.monthly_debt_payment) if profile.monthly_debt_payment else 0,
                'total_credit_limit': float(profile.total_credit_limit) if profile.total_credit_limit else 0,
                'current_credit_balance': float(profile.current_credit_balance) if profile.current_credit_balance else 0
            }

            # Return the score in a format that matches what the frontend expects
            return Response({
                "score": predicted_score,  # Use 'score' as the primary key
                "predicted_credit_score": predicted_score,  # Keep for backward compatibility
                "category": category,
                "message": message,
                "factors": factors,
                "financial_data": financial_data
            }, status=status.HTTP_200_OK)

        except UserFinancialProfile.DoesNotExist:
            logger.error(f"Financial profile not found for user {request.user.id}")
            return Response({
                "error": "Financial profile not found. Please create a profile first.",
                "error_details": {
                    "type": "UserFinancialProfile.DoesNotExist",
                    "message": "No financial profile exists for this user",
                    "user_id": request.user.id,
                    "resolution": "Create a financial profile by submitting financial data in the Dashboard"
                },
                "score": 650,  # Provide fallback values
                "category": "Good",
                "message": "Unable to calculate your credit score. Please complete your financial profile in the Dashboard.",
                "factors": ["Financial profile is incomplete or missing."],
                "financial_data": {},  # Empty financial data
                "fallback": True
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error during credit score prediction: {e}", exc_info=True)

            # Get detailed error information
            import traceback
            error_traceback = traceback.format_exc()
            error_type = type(e).__name__

            # Return a more helpful error response with detailed error information
            return Response({
                "error": f"An error occurred during prediction: {str(e)}",
                "error_details": {
                    "type": error_type,
                    "message": str(e),
                    "traceback": error_traceback.split("\n")
                },
                "score": 650,  # Provide fallback values
                "category": "Good",
                "message": "Unable to calculate your credit score accurately. Using default score.",
                "factors": ["Error in credit score calculation. Please try again later."],
                "financial_data": {},  # Empty financial data
                "fallback": True
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreditScoreHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing credit score history.
    """
    serializer_class = CreditScoreHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This view returns the credit score history for the currently authenticated user.
        """
        return CreditScoreHistory.objects.filter(user=self.request.user)


class LoanAccountViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing loan accounts.
    """
    serializer_class = LoanAccountSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        This view returns the loan accounts for the currently authenticated user.
        """
        user = self.request.user
        logger.info(f"Getting loan accounts for user: {user.id} ({user.email})")

        # Get all loans for this user
        loans = LoanAccount.objects.filter(user=user)
        logger.info(f"Found {loans.count()} loans for user {user.id}")

        return loans

    def perform_create(self, serializer):
        """
        Create a new loan account for the user.
        """
        user = self.request.user
        logger.info(f"Creating loan account for user: {user.id} ({user.email})")
        logger.info(f"Loan data: {serializer.validated_data}")

        try:
            # Save the loan with the current user
            loan = serializer.save(user=user)
            logger.info(f"Loan created successfully with ID: {loan.id}")

            # Update the user's financial profile with the new loan data
            try:
                profile = UserFinancialProfile.objects.get(user=user)

                # Calculate total loan amount and monthly payment
                user_loans = LoanAccount.objects.filter(user=user, is_active=True)
                total_loan_amount = sum(loan.remaining_balance for loan in user_loans)
                total_monthly_payment = sum(loan.monthly_payment for loan in user_loans)

                # Update the profile
                profile.loan_amount = total_loan_amount
                profile.monthly_payment = total_monthly_payment
                profile.total_accounts = user_loans.count()
                profile.save()

                logger.info(f"Updated user profile with new loan data: {profile.id}")
            except UserFinancialProfile.DoesNotExist:
                logger.warning(f"No financial profile found for user {user.id} when adding loan")
                # Create a default profile if one doesn't exist
                default_profile = {
                    'income': 30000,
                    'age': 30,
                    'employment_length': 5,
                    'debt_to_income': 0.3,
                    'credit_utilization': 0.3,
                    'payment_history': 0.7,
                    'credit_mix': 0.5,
                    'new_credit': 0.5,
                    'credit_history_length': 5,
                    'public_records': 0,
                    'total_accounts': 1,
                    'delinquent_accounts': 0,
                    'loan_amount': loan.remaining_balance,
                    'monthly_payment': loan.monthly_payment
                }
                profile = UserFinancialProfile.objects.create(user=user, **default_profile)
                logger.info(f"Created new profile for user {user.id} with loan data")
            except Exception as e:
                logger.error(f"Error updating profile after loan creation: {e}", exc_info=True)
        except Exception as e:
            logger.error(f"Error creating loan: {e}", exc_info=True)
            raise

    def list(self, request):
        """
        List all loans for the current user with detailed logging.
        """
        # Log authentication details
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        has_token = bool(auth_header)
        logger.info(f"List loans request - Auth header present: {has_token}")

        if not has_token:
            logger.warning("No authorization header in request")
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        # Get the queryset
        queryset = self.get_queryset()
        logger.info(f"Found {queryset.count()} loans for user {request.user.id}")

        # Serialize the data
        serializer = self.get_serializer(queryset, many=True)

        # Log the response data
        logger.info(f"Returning {len(serializer.data)} loans to user {request.user.id}")

        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Create a new loan with detailed logging.
        """
        # Log authentication details
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        has_token = bool(auth_header)
        logger.info(f"Create loan request - Auth header present: {has_token}")

        if not has_token:
            logger.warning("No authorization header in request")
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        logger.info(f"Received loan creation request from user {request.user.id}")
        logger.info(f"Request data: {request.data}")

        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            logger.info("Loan data is valid, creating loan")
            try:
                self.perform_create(serializer)
                headers = self.get_success_headers(serializer.data)

                # Log the created loan data
                logger.info(f"Loan created successfully: {serializer.data}")

                return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            except Exception as e:
                logger.error(f"Error in loan creation: {e}", exc_info=True)
                return Response(
                    {"error": "An error occurred while creating the loan", "detail": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            logger.error(f"Validation errors in loan creation: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a specific loan with detailed logging.
        """
        logger.info(f"Retrieving loan with pk={kwargs.get('pk')} for user {request.user.id}")
        return super().retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Update a specific loan with detailed logging.
        """
        logger.info(f"Updating loan with pk={kwargs.get('pk')} for user {request.user.id}")
        logger.info(f"Update data: {request.data}")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Delete a specific loan with detailed logging.
        """
        logger.info(f"Deleting loan with pk={kwargs.get('pk')} for user {request.user.id}")
        return super().destroy(request, *args, **kwargs)