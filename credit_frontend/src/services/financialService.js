import axiosInstance from './axiosConfig';
import {
  fetchFinancialProfile,
  updateFinancialProfile as updateProfile,
  calculateCreditScore as calculateScore
} from './dataService';

// Get user financial profile
export const getUserFinancialProfile = async () => {
  try {
    // Use the centralized data service
    return await fetchFinancialProfile();
  } catch (error) {
    console.error('Error fetching financial profile:', error);
    throw error;
  }
};

// Update user financial profile
export const updateFinancialProfile = async (profileData) => {
  try {
    // Use the centralized data service
    return await updateProfile(profileData);
  } catch (error) {
    console.error('Error updating financial profile:', error);
    throw error;
  }
};

// Get credit score history
export const getCreditScoreHistory = async () => {
  try {
    const response = await axiosInstance.get('/financial/credit-history/');
    return response.data;
  } catch (error) {
    console.error('Error fetching credit score history:', error);
    throw error;
  }
};

// Calculate credit score
export const calculateCreditScore = async (financialData) => {
  try {
    // Use the centralized data service
    return await calculateScore(financialData);
  } catch (error) {
    console.error('Error calculating credit score:', error);
    throw error;
  }
};

// Synchronize financial data with loan data
export const synchronizeFinancialData = async () => {
  try {
    // Get the financial profile
    const profile = await getUserFinancialProfile();

    // Get the loans
    const loansResponse = await axiosInstance.get('/financial/loans/');
    const loans = loansResponse.data;

    // Calculate total loan amount and monthly payment from loans
    if (loans && loans.length > 0) {
      const totalLoanAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance), 0);
      const totalMonthlyPayment = loans.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment), 0);

      // Update the financial profile if needed
      if (profile &&
          (Math.abs(totalLoanAmount - parseFloat(profile.loan_amount || 0)) > 100 ||
           Math.abs(totalMonthlyPayment - parseFloat(profile.monthly_payment || 0)) > 100)) {

        // Create updated profile data
        const updatedProfile = {
          ...profile,
          loan_amount: totalLoanAmount,
          monthly_payment: totalMonthlyPayment,
          total_accounts: loans.length
        };

        // Update debt-to-income ratio if income is available
        if (updatedProfile.income) {
          const monthlyIncome = parseFloat(updatedProfile.income);
          if (monthlyIncome > 0) {
            updatedProfile.debt_to_income = Math.min(totalMonthlyPayment / monthlyIncome, 1.0);
          }
        }

        // Update the profile
        await updateFinancialProfile(updatedProfile);

        // Recalculate credit score
        await calculateCreditScore(updatedProfile);
      }
    }

    return {
      profile: await getUserFinancialProfile(),
      loans
    };
  } catch (error) {
    console.error('Error synchronizing financial data:', error);
    throw error;
  }
};

export default {
  getUserFinancialProfile,
  updateFinancialProfile,
  getCreditScoreHistory,
  calculateCreditScore,
  synchronizeFinancialData
};
