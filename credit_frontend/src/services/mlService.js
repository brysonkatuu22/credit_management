import axiosInstance from './axiosConfig';
import { getCreditScoreHistory } from './financialService';

/**
 * Get model information and metadata
 * @returns {Promise<Object>} Model information
 */
export const getModelInfo = async () => {
  try {
    const response = await axiosInstance.get('/ml/model-info/');
    return response.data;
  } catch (error) {
    console.error('Error fetching model info:', error);
    // Return mock data for development instead of throwing error
    return getMockModelInfo();
  }
};

/**
 * Get credit score calculation history
 * @returns {Promise<Array>} Credit score history
 */
export const getCreditHistory = async () => {
  try {
    return await getCreditScoreHistory();
  } catch (error) {
    console.error('Error fetching credit history:', error);
    // Return mock data for development instead of throwing error
    return getMockCreditHistory();
  }
};

/**
 * Get mock model information for development
 * @returns {Object} Mock model info
 */
const getMockModelInfo = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  return {
    model_type: 'XGBoost Regressor',
    version: '1.0',
    last_trained: formattedDate,
    n_estimators: 100,
    max_depth: 6,
    learning_rate: 0.1,
    feature_importance: {
      'income': 0.25,
      'age': 0.12,
      'employment_length': 0.08,
      'debt_to_income': 0.18,
      'credit_utilization': 0.15,
      'payment_history': 0.22,
      'credit_mix': 0.05,
      'new_credit': 0.03,
      'credit_history_length': 0.10,
      'public_records': 0.07
    },
    performance_metrics: {
      mse: 13521.36,
      rmse: 116.28,
      mae: 92.22,
      r2: 0.28
    }
  };
};

/**
 * Get mock credit history for development
 * @returns {Array} Mock credit history
 */
const getMockCreditHistory = () => {
  const today = new Date();
  const oneWeekAgo = new Date(today);
  oneWeekAgo.setDate(today.getDate() - 7);
  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  return [
    {
      id: 1,
      score: 720,
      calculation_date: today.toISOString(),
      income: 50000,
      age: 35,
      debt_to_income: 0.3,
      credit_utilization: 0.25
    },
    {
      id: 2,
      score: 680,
      calculation_date: oneWeekAgo.toISOString(),
      income: 48000,
      age: 35,
      debt_to_income: 0.35,
      credit_utilization: 0.4
    },
    {
      id: 3,
      score: 650,
      calculation_date: twoWeeksAgo.toISOString(),
      income: 45000,
      age: 35,
      debt_to_income: 0.4,
      credit_utilization: 0.5
    }
  ];
};

/**
 * Make a direct prediction using the ML model
 * @param {Object} financialData - Financial data for prediction
 * @returns {Promise<Object>} Prediction result
 */
export const predictCreditScore = async (financialData) => {
  try {
    const response = await axiosInstance.post('/ml/predict/', financialData);
    return response.data;
  } catch (error) {
    console.error('Error making prediction:', error);
    // Return mock prediction for development instead of throwing error
    return getMockPrediction(financialData);
  }
};

/**
 * Get mock prediction for development
 * @param {Object} financialData - Financial data for prediction
 * @returns {Object} Mock prediction
 */
const getMockPrediction = (financialData) => {
  // Simple algorithm to generate a somewhat realistic score based on input data
  let baseScore = 650;

  // Income factor (higher income = higher score)
  if (financialData.income) {
    baseScore += Math.min(50, financialData.income / 2000);
  }

  // Debt-to-income factor (lower ratio = higher score)
  if (financialData.debt_to_income) {
    baseScore -= financialData.debt_to_income * 100;
  }

  // Credit utilization factor (lower utilization = higher score)
  if (financialData.credit_utilization) {
    baseScore -= financialData.credit_utilization * 80;
  }

  // Payment history factor (higher payment history = higher score)
  if (financialData.payment_history) {
    baseScore += financialData.payment_history * 100;
  }

  // Ensure score is within realistic bounds
  const finalScore = Math.max(300, Math.min(850, Math.round(baseScore)));

  return {
    score: finalScore,
    prediction_date: new Date().toISOString(),
    factors: {
      positive: [
        'Length of credit history',
        'Payment history',
        'Credit mix'
      ],
      negative: [
        'High credit utilization',
        'Recent credit inquiries',
        'High debt-to-income ratio'
      ]
    }
  };
};

export default {
  getModelInfo,
  getCreditHistory,
  predictCreditScore
};
