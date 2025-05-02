import axiosInstance from './axiosConfig';
import {
  fetchLoans,
  createLoan,
  deleteLoan
} from './dataService';
import { synchronizeFinancialData } from './financialService';

/**
 * Get all loan accounts for the current user
 * @returns {Promise<Array>} Array of loan accounts
 */
export const getLoanAccounts = async () => {
  try {
    // Use the centralized data service
    return await fetchLoans();
  } catch (error) {
    console.error('Error fetching loan accounts:', error);
    throw error;
  }
};

/**
 * Create a new loan account
 * @param {Object} loanData - Loan account data
 * @returns {Promise<Object>} Created loan account
 */
export const createLoanAccount = async (loanData) => {
  try {
    // Use the centralized data service
    const newLoan = await createLoan(loanData);

    // Synchronize with financial data
    await synchronizeFinancialData();

    return newLoan;
  } catch (error) {
    console.error('Error creating loan account:', error);
    throw error;
  }
};

/**
 * Update an existing loan account
 * @param {number} loanId - Loan account ID
 * @param {Object} loanData - Updated loan account data
 * @returns {Promise<Object>} Updated loan account
 */
export const updateLoanAccount = async (loanId, loanData) => {
  try {
    const response = await axiosInstance.put(`/financial/loans/${loanId}/`, loanData);

    // Synchronize with financial data
    await synchronizeFinancialData();

    return response.data;
  } catch (error) {
    console.error('Error updating loan account:', error);
    throw error;
  }
};

/**
 * Delete a loan account
 * @param {number} loanId - Loan account ID
 * @returns {Promise<void>}
 */
export const deleteLoanAccount = async (loanId) => {
  try {
    // Use the centralized data service
    await deleteLoan(loanId);

    // Synchronize with financial data
    await synchronizeFinancialData();
  } catch (error) {
    console.error('Error deleting loan account:', error);
    throw error;
  }
};

/**
 * Synchronize loan data with financial profile
 * This ensures consistency between loan accounts and financial profile
 * @returns {Promise<Object>} Synchronized data
 */
export const synchronizeLoanData = async () => {
  try {
    return await synchronizeFinancialData();
  } catch (error) {
    console.error('Error synchronizing loan data:', error);
    throw error;
  }
};

export default {
  getLoanAccounts,
  createLoanAccount,
  updateLoanAccount,
  deleteLoanAccount,
  synchronizeLoanData
};
