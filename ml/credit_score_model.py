import numpy as np
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, mean_squared_error
import joblib
import logging
import os
from typing import Tuple, Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class CreditScoreModel:
    def __init__(self):
        logging.info("Initializing CreditScoreModel with XGBoost...")
        self.model = xgb.XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        self.scaler = StandardScaler()
        
    def preprocess_data(self, data):
        logging.info("Preprocessing data...")
        return self.scaler.fit_transform(data)
    
    def train(self, X, y):
        logging.info("Training model...")
        X_scaled = self.preprocess_data(X)
        self.model.fit(X_scaled, y)
        logging.info("Model training completed.")
        
    def predict(self, X):
        logging.info("Making predictions...")
        X_scaled = self.scaler.transform(X)
        return self.model.predict(X)
    
    def save_model(self, path):
        try:
            logging.info(f"Saving model to {path}...")
            model_data = {
                'model': self.model,
                'scaler': self.scaler
            }
            joblib.dump(model_data, path)
            logging.info("Model saved successfully.")
        except Exception as e:
            logging.error(f"Error saving model: {e}")
    
    @classmethod
    def load_model(cls, path):
        try:
            logging.info(f"Loading model from {path}...")
            model_data = joblib.load(path)
            instance = cls()
            instance.model = model_data['model']
            instance.scaler = model_data['scaler']
            logging.info("Model loaded successfully.")
            return instance
        except Exception as e:
            logging.error(f"Error loading model: {e}")
            return None