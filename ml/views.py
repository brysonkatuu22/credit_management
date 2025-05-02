from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import logging
import os
import joblib
import numpy as np
from pathlib import Path
from datetime import datetime
import json

from .credit_score_model import CreditScoreModel

# Configure logging
logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def model_info(request):
    """
    Get information about the credit score model.
    """
    try:
        # Try to load the model
        model_path = Path(__file__).resolve().parent / 'models' / 'robust_credit_score_model.pkl'
        if not model_path.exists():
            model_path = Path(__file__).resolve().parent / 'models' / 'credit_score_model.pkl'
        
        if not model_path.exists():
            return Response({
                "error": "No trained model found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Load the model
        model_data = joblib.load(model_path)
        model = model_data['model']
        
        # Get model metadata
        model_info = {
            "model_type": type(model).__name__,
            "version": "1.0",
            "last_trained": datetime.fromtimestamp(os.path.getmtime(model_path)).strftime('%Y-%m-%d'),
            "n_estimators": model.n_estimators,
            "max_depth": model.max_depth,
            "learning_rate": model.learning_rate
        }
        
        # Get feature importance
        feature_names = [
            'income', 'age', 'employment_length', 'debt_to_income',
            'credit_utilization', 'payment_history', 'credit_mix',
            'new_credit', 'credit_history_length', 'public_records',
            'loan_amount', 'interest_rate', 'monthly_payment',
            'total_accounts', 'delinquent_accounts'
        ]
        
        # Convert feature importance to a dictionary
        feature_importance = {}
        for i, importance in enumerate(model.feature_importances_):
            if i < len(feature_names):
                feature_importance[feature_names[i]] = float(importance)
        
        # Sort by importance (descending)
        feature_importance = {k: v for k, v in sorted(
            feature_importance.items(), 
            key=lambda item: item[1], 
            reverse=True
        )}
        
        # Add feature importance to the response
        model_info["feature_importance"] = feature_importance
        
        # Add performance metrics (these would normally be stored with the model)
        # For now, we'll use the metrics from the last training run
        model_info["performance_metrics"] = {
            "mse": 13521.36,
            "rmse": 116.28,
            "mae": 92.22,
            "r2": 0.28
        }
        
        return Response(model_info)
    
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        return Response({
            "error": f"Error getting model info: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def predict_credit_score(request):
    """
    Make a credit score prediction using the ML model directly.
    """
    try:
        # Load the model
        model_path = Path(__file__).resolve().parent / 'models' / 'robust_credit_score_model.pkl'
        if not model_path.exists():
            model_path = Path(__file__).resolve().parent / 'models' / 'credit_score_model.pkl'
        
        if not model_path.exists():
            return Response({
                "error": "No trained model found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Load the model
        model_instance = CreditScoreModel.load_model(str(model_path))
        
        if not model_instance:
            return Response({
                "error": "Failed to load model"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get input features from request
        data = request.data
        
        # Validate input
        required_fields = [
            'income', 'age', 'employment_length', 'debt_to_income',
            'credit_utilization', 'payment_history', 'credit_mix',
            'new_credit', 'credit_history_length', 'public_records'
        ]
        
        for field in required_fields:
            if field not in data:
                return Response({
                    "error": f"Missing required field: {field}"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Prepare input features
        feature_values = [
            float(data.get('income', 0)),
            float(data.get('age', 0)),
            float(data.get('employment_length', 0)),
            float(data.get('debt_to_income', 0)),
            float(data.get('credit_utilization', 0)),
            float(data.get('payment_history', 0)),
            float(data.get('credit_mix', 0)),
            float(data.get('new_credit', 0)),
            float(data.get('credit_history_length', 0)),
            float(data.get('public_records', 0)),
            float(data.get('loan_amount', 0)),
            float(data.get('interest_rate', 0)),
            float(data.get('monthly_payment', 0)),
            float(data.get('total_accounts', 0)),
            float(data.get('delinquent_accounts', 0))
        ]
        
        # Make prediction
        input_features = np.array([feature_values])
        prediction = model_instance.predict(input_features)
        
        # Ensure prediction is within valid range (300-850)
        predicted_score = int(max(300, min(850, prediction[0])))
        
        # Determine credit score category
        category = ""
        if predicted_score >= 800:
            category = "Exceptional"
        elif predicted_score >= 740:
            category = "Excellent"
        elif predicted_score >= 670:
            category = "Good"
        elif predicted_score >= 580:
            category = "Fair"
        else:
            category = "Poor"
        
        # Return prediction
        return Response({
            "score": predicted_score,
            "category": category,
            "model_version": "1.0"
        })
    
    except Exception as e:
        logger.error(f"Error making prediction: {e}")
        return Response({
            "error": f"Error making prediction: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
