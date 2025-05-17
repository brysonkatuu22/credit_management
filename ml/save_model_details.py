import joblib
import pandas as pd
import os

def save_model_details_to_csv(model_path, csv_path):
    if not os.path.exists(model_path):
        print(f"Model file not found at {model_path}")
        return
    
    try:
        model_data = joblib.load(model_path)
        model = model_data['model']
        
        # Extract model details
        model_details = {
            'Model Type': [type(model).__name__],
            'Number of Estimators': [model.n_estimators],
            'Max Depth': [model.max_depth],
            'Feature Importances': [model.feature_importances_]
        }
        
        # Convert to DataFrame
        df = pd.DataFrame(model_details)
        
        # Save to CSV
        df.to_csv(csv_path, index=False)
        print(f"Model details saved to {csv_path}")
        
    except Exception as e:
        print(f"Error loading model: {e}")

if __name__ == "__main__":
    save_model_details_to_csv('ml/models/credit_score_model.pkl', 'model_details.csv') 