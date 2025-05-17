import numpy as np
import pandas as pd
from sklearn.datasets import make_classification
import logging
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def generate_credit_data(n_samples=1000, random_state=42):
    """
    Generate synthetic credit data for training and testing.

    Parameters:
    -----------
    n_samples : int
        Number of samples to generate
    random_state : int
        Random seed for reproducibility

    Returns:
    --------
    X : numpy.ndarray
        Feature matrix
    y : numpy.ndarray
        Target labels (credit scores)
    """
    # Input validation
    if n_samples <= 0:
        raise ValueError("n_samples must be positive")

    logging.info(f"Generating synthetic credit data with {n_samples} samples...")
    # Generate synthetic features with more informative features
    X, y = make_classification(
        n_samples=n_samples,
        n_features=15,  # Increase number of features
        n_informative=10,  # More informative features
        n_redundant=3,
        n_clusters_per_class=2,
        random_state=random_state
    )

    # Create feature names
    feature_names = [
        'income',
        'age',
        'employment_length',
        'debt_to_income',
        'credit_utilization',
        'payment_history',
        'credit_mix',
        'new_credit',
        'credit_history_length',
        'public_records',
        'loan_amount',
        'interest_rate',
        'monthly_payment',
        'total_accounts',
        'delinquent_accounts'
    ]

    # Convert to DataFrame
    df = pd.DataFrame(X, columns=feature_names)

    # Scale features to realistic ranges
    df['income'] = df['income'] * 50000 + 30000  # Income between 30k and 80k
    df['age'] = df['age'] * 30 + 25  # Age between 25 and 55
    df['employment_length'] = df['employment_length'] * 20 + 1  # 1-21 years
    df['debt_to_income'] = df['debt_to_income'] * 0.5 + 0.2  # 20-70%
    df['credit_utilization'] = df['credit_utilization'] * 0.8 + 0.1  # 10-90%
    df['loan_amount'] = df['loan_amount'] * 50000 + 5000  # Loan amount between 5k and 55k
    df['interest_rate'] = df['interest_rate'] * 5 + 3  # Interest rate between 3% and 8%
    df['monthly_payment'] = df['monthly_payment'] * 1000 + 200  # Monthly payment between 200 and 1200
    df['total_accounts'] = df['total_accounts'] * 10 + 5  # Total accounts between 5 and 15
    df['delinquent_accounts'] = df['delinquent_accounts'] * 2  # Delinquent accounts between 0 and 2

    # Convert credit scores to realistic ranges (300-850)
    y = y * 275 + 575

    logging.info("Synthetic data generation completed.")
    return df.values, y

def save_synthetic_data(X, y, output_path):
    """
    Save synthetic data to CSV files.
    """
    logging.info(f"Saving synthetic data to {output_path}...")
    try:
        # Create output directory if it doesn't exist
        os.makedirs(output_path, exist_ok=True)

        feature_names = [
            'income',
            'age',
            'employment_length',
            'debt_to_income',
            'credit_utilization',
            'payment_history',
            'credit_mix',
            'new_credit',
            'credit_history_length',
            'public_records',
            'loan_amount',
            'interest_rate',
            'monthly_payment',
            'total_accounts',
            'delinquent_accounts'
        ]

        # Create DataFrames from numpy arrays
        X_df = pd.DataFrame(X, columns=feature_names)
        y_df = pd.DataFrame(y, columns=['credit_score'])

        # Save to CSV
        X_df.to_csv(f'{output_path}/features.csv', index=False)
        y_df.to_csv(f'{output_path}/targets.csv', index=False)
        logging.info("Synthetic data saved successfully.")
    except Exception as e:
        logging.error(f"Error creating output directory: {str(e)}")
        raise



def main():
    n_samples = 1000
    X, y = generate_credit_data(n_samples)
    save_synthetic_data(X, y, 'data')


if __name__ == "__main__":
    main()
    
   