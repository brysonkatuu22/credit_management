import os
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import numpy as np
import logging
import argparse
from pathlib import Path

from credit_score_model import CreditScoreModel
from generate_synthetic_data import generate_credit_data, save_synthetic_data

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def validate_parameters(n_samples: int, test_size: float) -> None:
    if n_samples <= 0:
        raise ValueError("n_samples must be positive")
    if not 0 < test_size < 1:
        raise ValueError("test_size must be between 0 and 1")

def evaluate_model(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """Calculate and return multiple evaluation metrics."""
    return {
        'mse': mean_squared_error(y_true, y_pred),
        'rmse': np.sqrt(mean_squared_error(y_true, y_pred)),
        'mae': mean_absolute_error(y_true, y_pred),
        'r2': r2_score(y_true, y_pred)
    }

def train_model(n_samples=1000, test_size=0.2, save_data=True):
    """Train the credit score model using synthetic data."""
    try:
        # Validate parameters
        validate_parameters(n_samples, test_size)
        
        # Create necessary directories
        model_dir = Path('models')
        data_dir = Path('data')
        model_dir.mkdir(exist_ok=True)
        data_dir.mkdir(exist_ok=True)
        
        # Generate synthetic data
        logging.info("Generating synthetic data...")
        X, y = generate_credit_data(n_samples=n_samples)
        
        # Save generated data if requested
        if save_data:
            save_synthetic_data(X, y, str(data_dir))
        
        # Split the data
        logging.info("Splitting data...")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )
        
        # Initialize and train the model
        logging.info("Training model...")
        model = CreditScoreModel()
        model.train(X_train, y_train)
        
        # Make predictions and evaluate
        logging.info("Evaluating model...")
        y_pred = model.predict(X_test)
        metrics = evaluate_model(y_test, y_pred)
        
        # Log all metrics
        logging.info("Model Performance:")
        for metric_name, value in metrics.items():
            logging.info(f"{metric_name.upper()}: {value:.4f}")
        
        # Save the model
        model_path = model_dir / 'credit_score_model.pkl'
        model.save_model(str(model_path))
        logging.info(f"Model saved to {model_path}")
        
        return model, metrics
        
    except Exception as e:
        logging.error(f"Error during model training: {e}")
        raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Train the credit score model.')
    parser.add_argument('--n_samples', type=int, default=1000,
                      help='Number of samples to generate for training')
    parser.add_argument('--test_size', type=float, default=0.2,
                      help='Proportion of data to use for testing')
    parser.add_argument('--no-save-data', action='store_false', dest='save_data',
                      help='Do not save the generated data')
    args = parser.parse_args()
    
    try:
        model, metrics = train_model(
            n_samples=args.n_samples,
            test_size=args.test_size,
            save_data=args.save_data
        )
    except Exception as e:
        logging.error(f"Training failed: {e}")
        exit(1)