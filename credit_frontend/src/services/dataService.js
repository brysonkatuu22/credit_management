import { BehaviorSubject } from 'rxjs';
import axiosInstance from './axiosConfig';

// Create observable data stores
const userDataSubject = new BehaviorSubject(null);
const financialProfileSubject = new BehaviorSubject(null);
const creditScoreSubject = new BehaviorSubject(null);
const loansSubject = new BehaviorSubject([]);

// Export the observables
export const userData$ = userDataSubject.asObservable();
export const financialProfile$ = financialProfileSubject.asObservable();
export const creditScore$ = creditScoreSubject.asObservable();
export const loans$ = loansSubject.asObservable();

// Initialize data from localStorage
const initializeFromLocalStorage = () => {
  try {
    // User data
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      userDataSubject.next(JSON.parse(userInfo));
    }

    // Financial profile
    const financialProfile = localStorage.getItem('financialProfile');
    if (financialProfile) {
      financialProfileSubject.next(JSON.parse(financialProfile));
    }

    // Credit score
    const creditScore = localStorage.getItem('creditScore');
    if (creditScore) {
      creditScoreSubject.next(JSON.parse(creditScore));
    }

    // Loans
    const loans = localStorage.getItem('loans');
    if (loans) {
      loansSubject.next(JSON.parse(loans));
    }

    // Credit reports
    const creditReports = localStorage.getItem('creditReports');
    if (creditReports) {
      creditReportsSubject.next(JSON.parse(creditReports));
    }

    // Dashboard metrics
    const dashboardMetrics = localStorage.getItem('dashboardMetrics');
    if (dashboardMetrics) {
      dashboardMetricsSubject.next(JSON.parse(dashboardMetrics));
    }
  } catch (error) {
    console.error('Error initializing data from localStorage:', error);
  }
};

// Initialize data
initializeFromLocalStorage();

// Create additional observables for credit reports and dashboard metrics
const creditReportsSubject = new BehaviorSubject([]);
const dashboardMetricsSubject = new BehaviorSubject({
  activeLoans: 0,
  creditReportsGenerated: 0,
  scoreChange: 'N/A'
});

// Export the new observables
export const creditReports$ = creditReportsSubject.asObservable();
export const dashboardMetrics$ = dashboardMetricsSubject.asObservable();

// User data functions
export const updateUserData = (data) => {
  userDataSubject.next(data);
  localStorage.setItem('userInfo', JSON.stringify(data));
};

// Financial profile functions
export const fetchFinancialProfile = async () => {
  // Check if we already have a cached profile that's recent (less than 5 minutes old)
  const cachedProfileJson = localStorage.getItem('financialProfile');
  const cachedTime = localStorage.getItem('profileTimestamp');

  if (cachedProfileJson && cachedTime) {
    try {
      const cachedProfile = JSON.parse(cachedProfileJson);

      // If we have a cached profile and it's less than 5 minutes old, use it
      if (cachedProfile) {
        const now = new Date().getTime();
        const timestamp = parseInt(cachedTime, 10);
        const fiveMinutes = 5 * 60 * 1000;

        if (now - timestamp < fiveMinutes) {
          console.log('Using cached financial profile (less than 5 minutes old)');
          financialProfileSubject.next(cachedProfile); // Update the subject with cached data
          return cachedProfile;
        }
      }
    } catch (e) {
      console.error('Error parsing cached profile:', e);
    }
  }

  try {
    console.log('Fetching financial profile...');

    // Try to get from API
    const response = await axiosInstance.get('/financial/profile/');
    const profileData = response.data;

    // Update cache
    financialProfileSubject.next(profileData);
    localStorage.setItem('financialProfile', JSON.stringify(profileData));
    localStorage.setItem('profileTimestamp', new Date().getTime().toString());

    console.log('Financial profile fetched successfully');
    return profileData;
  } catch (error) {
    console.error('Error fetching financial profile:', error);

    // If this is a 404 (profile not found), don't treat it as an error
    if (error.response && error.response.status === 404) {
      console.log('No financial profile found for this user yet');
      // Clear any cached profile data
      localStorage.removeItem('financialProfile');
      localStorage.removeItem('profileTimestamp');
      financialProfileSubject.next(null);

      // Return an empty object instead of throwing an error
      return {};
    }

    // Check if we have a cached version in the subject
    const cachedProfile = financialProfileSubject.getValue();
    if (cachedProfile) {
      console.log('Using cached financial profile from subject');
      return cachedProfile;
    }

    // Check if we have a cached version in localStorage (even if older than 5 minutes)
    if (cachedProfileJson) {
      try {
        const parsedProfile = JSON.parse(cachedProfileJson);
        console.log('Using localStorage financial profile as fallback');
        financialProfileSubject.next(parsedProfile);
        return parsedProfile;
      } catch (localStorageError) {
        console.error('Error reading from localStorage:', localStorageError);
      }
    }

    // If we get here, we couldn't get the profile from anywhere
    // Add a user-friendly error message
    if (error.userMessage) {
      throw error;
    } else {
      error.userMessage = 'Unable to load your financial profile. Please check your connection and try again.';
      throw error;
    }
  }
};

export const updateFinancialProfile = async (profileData) => {
  try {
    const response = await axiosInstance.post('/financial/profile/', profileData);
    const updatedProfile = response.data;

    financialProfileSubject.next(updatedProfile);
    localStorage.setItem('financialProfile', JSON.stringify(updatedProfile));

    return updatedProfile;
  } catch (error) {
    console.error('Error updating financial profile:', error);
    throw error;
  }
};

// Credit score functions
export const calculateCreditScore = async (financialData) => {
  // IMPORTANT: We're disabling the time-based cache to ensure the score changes when input data changes
  // Instead, we'll use a hash of the input data to determine if we should use the cache

  // Create a hash of the important financial data to use as a cache key
  const getFinancialDataHash = (data) => {
    // Extract the fields that affect credit score
    const relevantFields = [
      'income', 'age', 'employment_length', 'credit_history_length',
      'payment_history', 'credit_utilization', 'debt_to_income',
      'public_records', 'delinquent_accounts', 'total_accounts',
      'monthly_debt_payment', 'loan_amount'
    ];

    // Create a string representation of the relevant data
    const dataString = relevantFields
      .map(field => `${field}:${data[field] || 0}`)
      .join('|');

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return hash.toString();
  };

  // Get the hash of the current financial data
  const currentDataHash = getFinancialDataHash(financialData);

  // Check if we have a cached score with the same data hash
  const cachedScoreJson = localStorage.getItem('creditScore');
  const cachedDataHash = localStorage.getItem('creditScoreDataHash');

  if (cachedScoreJson && cachedDataHash === currentDataHash) {
    try {
      const cachedScore = JSON.parse(cachedScoreJson);
      console.log('Using cached credit score (same financial data)');
      return cachedScore;
    } catch (e) {
      console.error('Error parsing cached credit score:', e);
    }
  }

  // Log that we're calculating a new score because the data changed
  if (cachedDataHash && cachedDataHash !== currentDataHash) {
    console.log('Financial data changed, calculating new credit score');
  }

  try {
    console.log('Calculating credit score...');

    // Ensure all numeric values are properly formatted - optimized version
    const formattedData = {};

    // Only process fields that are needed for credit score calculation
    const requiredFields = [
      'income', 'age', 'employment_length', 'credit_history_length',
      'payment_history', 'credit_utilization', 'debt_to_income',
      'public_records', 'loan_amount', 'monthly_payment'
    ];

    // Check for missing critical fields
    const criticalFields = ['income', 'age', 'employment_length', 'credit_history_length'];
    const missingCriticalFields = criticalFields.filter(field =>
      !financialData[field] || financialData[field] === null || financialData[field] === undefined
    );

    if (missingCriticalFields.length > 0) {
      console.warn(`Missing critical fields for credit score calculation: ${missingCriticalFields.join(', ')}`);

      // Try to use cached score as fallback
      const cachedScore = creditScoreSubject.getValue();
      if (cachedScore) {
        console.log('Using cached credit score due to missing critical fields');
        return {
          ...cachedScore,
          message: "This is a previously calculated score. Please complete all required financial information for an updated score.",
          cached: true
        };
      }
    }

    requiredFields.forEach(key => {
      if (key in financialData && financialData[key] !== null && financialData[key] !== undefined) {
        // Convert string numbers to actual numbers
        if (typeof financialData[key] === 'string' && !isNaN(financialData[key])) {
          formattedData[key] = Number(financialData[key]);
        } else {
          formattedData[key] = financialData[key];
        }
      }
    });

    // Add retry logic for the API call
    let retries = 2;
    let lastError = null;

    while (retries >= 0) {
      try {
        // Make the API call with the formatted data
        const response = await axiosInstance.post('/financial/calculate-credit-score/', formattedData);
        const scoreData = response.data;

        // Update the cache with the new score and the data hash
        creditScoreSubject.next(scoreData);
        localStorage.setItem('creditScore', JSON.stringify(scoreData));
        localStorage.setItem('creditScoreTimestamp', new Date().getTime().toString());
        localStorage.setItem('creditScoreDataHash', currentDataHash); // Store the data hash

        console.log('Credit score calculated successfully:', scoreData.score);
        return scoreData;
      } catch (apiError) {
        lastError = apiError;
        console.error(`Error calculating credit score (retries left: ${retries}):`, apiError);
        retries--;

        if (retries >= 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`Retrying credit score calculation...`);
        }
      }
    }

    // If we get here, all retries failed
    throw lastError;
  } catch (error) {
    console.error('All attempts to calculate credit score failed:', error);

    // Add detailed error information
    if (!error.technicalDetails) {
      error.technicalDetails = {
        component: 'calculateCreditScore',
        timestamp: new Date().toISOString(),
        originalError: error.message,
        stack: error.stack,
        financialData: financialData ? {
          // Include only non-sensitive data for debugging
          hasIncome: !!financialData.income,
          hasAge: !!financialData.age,
          hasEmploymentLength: !!financialData.employment_length,
          hasCreditHistory: !!financialData.credit_history_length,
          hasPaymentHistory: !!financialData.payment_history
        } : null,
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        } : null
      };
    }

    // Try to use cached score even if it's older than 5 minutes
    const cachedScore = creditScoreSubject.getValue();
    if (cachedScore) {
      console.log('Using cached credit score as fallback');
      return {
        ...cachedScore,
        message: cachedScore.message || "This is a previously calculated score. There was an error calculating a new score.",
        cached: true,
        error: {
          message: error.message,
          technicalDetails: error.technicalDetails
        }
      };
    }

    // If no cached score is available, generate a client-side fallback score
    console.log('No cached score available, generating client-side fallback score');

    // Simple client-side calculation as absolute last resort
    let baseScore = 650; // Start with average score

    try {
      if (financialData) {
        // Adjust based on payment history (if available)
        if (financialData.payment_history) {
          baseScore += financialData.payment_history * 50;
        }

        // Adjust based on credit utilization (if available)
        if (financialData.credit_utilization) {
          baseScore -= financialData.credit_utilization * 30;
        }

        // Adjust based on income (if available)
        if (financialData.income) {
          baseScore += Math.min(financialData.income / 20000, 30);
        }

        // Ensure score is within valid range
        baseScore = Math.max(300, Math.min(850, Math.round(baseScore)));
      }
    } catch (calcError) {
      console.error('Error in fallback score calculation:', calcError);
      baseScore = 650; // Reset to default if calculation fails
    }

    // Determine category based on score
    let category = "Good";
    if (baseScore >= 800) category = "Exceptional";
    else if (baseScore >= 740) category = "Excellent";
    else if (baseScore >= 670) category = "Good";
    else if (baseScore >= 580) category = "Fair";
    else category = "Poor";

    const fallbackScore = {
      score: baseScore,
      category: category,
      message: "This is an estimated score. There was an error calculating your actual score.",
      factors: {
        positive: ["Estimated score based on available data"],
        negative: ["Error in credit score calculation"]
      },
      fallback: true,
      error: {
        message: error.message || "Unknown error",
        technicalDetails: error.technicalDetails || {
          component: 'calculateCreditScore',
          errorType: 'FALLBACK_CALCULATION',
          timestamp: new Date().toISOString(),
          originalError: error.message,
          stack: error.stack
        }
      }
    };

    // Cache this fallback score with the data hash
    creditScoreSubject.next(fallbackScore);
    localStorage.setItem('creditScore', JSON.stringify(fallbackScore));
    localStorage.setItem('creditScoreDataHash', currentDataHash); // Store the data hash

    return fallbackScore;
  }
};

// Loan functions
export const fetchLoans = async () => {
  // Check if we already have a cached loans that's recent (less than 5 minutes old)
  const cachedLoansJson = localStorage.getItem('loans');
  const cachedTime = localStorage.getItem('loansTimestamp');

  if (cachedLoansJson && cachedTime) {
    try {
      const cachedLoans = JSON.parse(cachedLoansJson);

      // If we have cached loans and it's less than 5 minutes old, use it
      if (cachedLoans) {
        const now = new Date().getTime();
        const timestamp = parseInt(cachedTime, 10);
        const fiveMinutes = 5 * 60 * 1000;

        if (now - timestamp < fiveMinutes) {
          console.log(`Using cached loans (less than 5 minutes old): ${cachedLoans.length} loans`);
          return cachedLoans;
        }
      }
    } catch (e) {
      console.error('Error parsing cached loans:', e);
    }
  }

  try {
    console.log('Fetching loans...');

    // Try to get from API
    const response = await axiosInstance.get('/financial/loans/');
    const loansData = response.data;

    // Update cache
    loansSubject.next(loansData);
    localStorage.setItem('loans', JSON.stringify(loansData));
    localStorage.setItem('loansTimestamp', new Date().getTime().toString());

    console.log(`Loans fetched successfully: ${loansData.length} loans`);
    return loansData;
  } catch (error) {
    console.error('Error fetching loans:', error);

    // Check if we have a cached version in the subject
    const cachedLoans = loansSubject.getValue();
    if (cachedLoans && cachedLoans.length > 0) {
      console.log(`Using cached loans from subject: ${cachedLoans.length} loans`);
      return cachedLoans;
    }

    // Check if we have a cached version in localStorage (even if older than 5 minutes)
    if (cachedLoansJson) {
      try {
        const parsedLoans = JSON.parse(cachedLoansJson);
        console.log(`Using localStorage loans as fallback: ${parsedLoans.length} loans`);
        loansSubject.next(parsedLoans);
        return parsedLoans;
      } catch (localStorageError) {
        console.error('Error reading from localStorage:', localStorageError);
      }
    }

    // If we get here, we couldn't get the loans from anywhere
    // Return an empty array instead of throwing an error to prevent cascading failures
    console.log('No loans found, returning empty array');
    return [];
  }
};

export const createLoan = async (loanData) => {
  try {
    console.log('Creating new loan with data:', loanData);

    // Validate required fields before making the API call
    const requiredFields = ['lender', 'principal_amount', 'interest_rate', 'term_months', 'monthly_payment'];
    const missingFields = requiredFields.filter(field => !loanData[field]);

    if (missingFields.length > 0) {
      const error = new Error(`Missing required fields: ${missingFields.join(', ')}`);
      error.technicalDetails = {
        component: 'createLoan',
        missingFields,
        providedData: { ...loanData }
      };
      throw error;
    }

    // Make sure numeric fields are actually numbers
    const numericFields = ['principal_amount', 'interest_rate', 'term_months', 'monthly_payment', 'remaining_balance'];
    numericFields.forEach(field => {
      if (loanData[field] && typeof loanData[field] === 'string') {
        loanData[field] = parseFloat(loanData[field].replace(/,/g, ''));
      }
    });

    // Ensure remaining_balance is set if not provided
    if (!loanData.remaining_balance && loanData.principal_amount) {
      loanData.remaining_balance = loanData.principal_amount;
    }

    // Add retry logic for the API call
    let retries = 2;
    let lastError = null;

    while (retries >= 0) {
      try {
        const response = await axiosInstance.post('/financial/loans/', loanData);
        const newLoan = response.data;

        console.log('Loan created successfully:', newLoan);

        // Update the loans list
        const currentLoans = loansSubject.getValue() || [];
        const updatedLoans = [...currentLoans, newLoan];

        loansSubject.next(updatedLoans);
        localStorage.setItem('loans', JSON.stringify(updatedLoans));
        localStorage.setItem('loansTimestamp', new Date().getTime().toString());

        // Refresh financial profile to ensure consistency
        try {
          await fetchFinancialProfile();
        } catch (profileError) {
          console.warn('Could not refresh financial profile after loan creation:', profileError);
          // Continue anyway - the loan was created successfully
        }

        return newLoan;
      } catch (apiError) {
        lastError = apiError;
        console.error(`Error creating loan (retries left: ${retries}):`, apiError);
        retries--;

        if (retries >= 0) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          console.log(`Retrying loan creation...`);
        }
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      // Add technical details to the error
      lastError.technicalDetails = {
        component: 'createLoan',
        timestamp: new Date().toISOString(),
        loanData: {
          lender: loanData.lender,
          loan_type: loanData.loan_type,
          // Don't include sensitive financial details in the error
        },
        retryAttempts: 2
      };
      throw lastError;
    } else {
      const error = new Error('Failed to create loan after multiple attempts');
      error.technicalDetails = {
        component: 'createLoan',
        timestamp: new Date().toISOString()
      };
      throw error;
    }
  } catch (error) {
    console.error('Error creating loan:', error);

    // Add technical details if not already present
    if (!error.technicalDetails) {
      error.technicalDetails = {
        component: 'createLoan',
        timestamp: new Date().toISOString(),
        message: error.message
      };
    }

    throw error;
  }
};

export const deleteLoan = async (loanId) => {
  try {
    await axiosInstance.delete(`/financial/loans/${loanId}/`);

    // Update the loans list
    const currentLoans = loansSubject.getValue();
    const updatedLoans = currentLoans.filter(loan => loan.id !== loanId);

    loansSubject.next(updatedLoans);
    localStorage.setItem('loans', JSON.stringify(updatedLoans));

    // Refresh financial profile to ensure consistency
    await fetchFinancialProfile();

    return true;
  } catch (error) {
    console.error('Error deleting loan:', error);
    throw error;
  }
};

// Synchronize data between modules
export const synchronizeData = async () => {
  try {
    console.log('Starting data synchronization...');

    // Check if we've synchronized recently (within the last minute)
    const lastSyncTime = localStorage.getItem('lastSyncTimestamp');
    if (lastSyncTime) {
      const now = new Date().getTime();
      const timestamp = parseInt(lastSyncTime, 10);
      const oneMinute = 60 * 1000;

      if (now - timestamp < oneMinute) {
        console.log('Using cached data (synchronized less than a minute ago)');

        // Return cached data
        return {
          profile: financialProfileSubject.getValue(),
          loans: loansSubject.getValue(),
          creditScore: creditScoreSubject.getValue(),
          dashboardMetrics: dashboardMetricsSubject.getValue(),
          creditReports: creditReportsSubject.getValue()
        };
      }
    }

    // Fetch profile and loans in parallel to speed up the process
    const [profile, loans] = await Promise.all([
      fetchFinancialProfile(),
      fetchLoans()
    ]);

    console.log('Fetched initial data');

    // Only update profile if necessary and if we have both profile and loans
    let updatedProfile = profile;
    if (profile && loans && loans.length > 0) {
      // Calculate total loan amount and monthly payment from loans
      const totalLoanAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.remaining_balance || 0), 0);
      const totalMonthlyPayment = loans.reduce((sum, loan) => sum + parseFloat(loan.monthly_payment || 0), 0);
      const totalAccounts = loans.length;

      // Check if there's a significant discrepancy between profile and loans data
      const profileLoanAmount = parseFloat(profile.loan_amount || 0);
      const profileMonthlyPayment = parseFloat(profile.monthly_payment || 0);

      const loanAmountDiscrepancy = Math.abs(totalLoanAmount - profileLoanAmount);
      const monthlyPaymentDiscrepancy = Math.abs(totalMonthlyPayment - profileMonthlyPayment);

      // If there's a significant discrepancy, update the financial profile
      if (loanAmountDiscrepancy > 100 || monthlyPaymentDiscrepancy > 100 || profile.total_accounts !== totalAccounts) {
        console.log('Updating profile to match loan data');

        // Create updated profile data
        const updatedProfileData = {
          ...profile,
          loan_amount: totalLoanAmount,
          monthly_payment: totalMonthlyPayment,
          total_accounts: totalAccounts
        };

        // Update debt-to-income ratio if income is available
        if (updatedProfileData.income) {
          const monthlyIncome = parseFloat(updatedProfileData.income);
          if (monthlyIncome > 0) {
            updatedProfileData.debt_to_income = Math.min(totalMonthlyPayment / monthlyIncome, 1.0);
          }
        }

        try {
          // Update the profile
          updatedProfile = await updateFinancialProfile(updatedProfileData);
        } catch (updateError) {
          console.error('Error updating profile:', updateError);
          // Continue with the original profile
          updatedProfile = profile;
        }
      }
    }

    // Calculate credit score with the latest profile data
    let creditScore = null;
    try {
      if (updatedProfile) {
        creditScore = await calculateCreditScore(updatedProfile);
      }
    } catch (creditScoreError) {
      console.error('Error calculating credit score:', creditScoreError);
      // Use cached score
      creditScore = creditScoreSubject.getValue();
    }

    // Update dashboard metrics and fetch reports in parallel
    const [metrics, reports] = await Promise.all([
      updateDashboardMetrics(loans, creditScore).catch(e => {
        console.error('Error updating metrics:', e);
        return dashboardMetricsSubject.getValue();
      }),
      fetchCreditReports().catch(e => {
        console.error('Error fetching reports:', e);
        return creditReportsSubject.getValue();
      })
    ]);

    // Store the sync timestamp
    localStorage.setItem('lastSyncTimestamp', new Date().getTime().toString());

    console.log('Data synchronization completed successfully');

    // Return the synchronized data
    return {
      profile: updatedProfile,
      loans,
      creditScore,
      dashboardMetrics: metrics,
      creditReports: reports
    };
  } catch (error) {
    console.error('Error synchronizing data:', error);

    // Add detailed error information if not already present
    if (!error.technicalDetails) {
      error.technicalDetails = {
        component: 'synchronizeData',
        timestamp: new Date().toISOString(),
        originalError: error.message,
        stack: error.stack
      };
    }

    // Try to return whatever data we have in cache
    const cachedProfile = financialProfileSubject.getValue();
    const cachedLoans = loansSubject.getValue();
    const cachedCreditScore = creditScoreSubject.getValue();
    const cachedMetrics = dashboardMetricsSubject.getValue();
    const cachedReports = creditReportsSubject.getValue();

    // If we have some cached data, return it instead of failing
    if (cachedProfile || (cachedLoans && cachedLoans.length > 0)) {
      console.log('Returning cached data due to synchronization error');
      return {
        profile: cachedProfile,
        loans: cachedLoans || [],
        creditScore: cachedCreditScore,
        dashboardMetrics: cachedMetrics,
        creditReports: cachedReports,
        error: {
          message: error.message,
          technicalDetails: error.technicalDetails,
          usingCachedData: true
        }
      };
    }

    // If we have no cached data, provide a specific error message
    if (!cachedProfile) {
      console.log('No financial profile data available');
      const customError = new Error('Please enter your financial information in the Dashboard first. This data is required for credit score calculation.');
      customError.code = 'NO_FINANCIAL_DATA';
      customError.technicalDetails = {
        component: 'synchronizeData',
        errorType: 'MISSING_PROFILE',
        timestamp: new Date().toISOString(),
        originalError: error.message,
        stack: error.stack
      };
      throw customError;
    } else if (!cachedLoans || cachedLoans.length === 0) {
      console.log('No loan accounts data available');
      const customError = new Error('No loan accounts found. Please add a loan account first to see it reflected in your credit score.');
      customError.code = 'NO_LOAN_DATA';
      customError.technicalDetails = {
        component: 'synchronizeData',
        errorType: 'MISSING_LOANS',
        timestamp: new Date().toISOString(),
        originalError: error.message,
        stack: error.stack
      };
      throw customError;
    }

    // If we get here, it's some other error
    const genericError = new Error(`Unable to synchronize data: ${error.message}. Please try again in a moment.`);
    genericError.originalError = error;
    genericError.technicalDetails = {
      component: 'synchronizeData',
      errorType: 'SYNC_FAILURE',
      timestamp: new Date().toISOString(),
      originalError: error.message,
      stack: error.stack,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      } : null
    };
    throw genericError;
  }
};

// Initialize all data from API - this is the central feeding point
export const initializeAllData = async () => {
  try {
    console.log('Initializing all data from API...');

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('User not authenticated. Cannot initialize data.');
      return false;
    }

    // Synchronize all data
    const result = await synchronizeData();

    console.log('All data initialized successfully:', result);
    return true;
  } catch (error) {
    console.error('Error initializing all data:', error);
    return false;
  }
};

// Credit reports functions
export const fetchCreditReports = async () => {
  try {
    // Try to fetch credit reports from API
    const response = await axiosInstance.get('/credit-report/reports/');
    const reports = response.data;

    creditReportsSubject.next(reports);
    localStorage.setItem('creditReports', JSON.stringify(reports));

    return reports;
  } catch (error) {
    console.error('Error fetching credit reports:', error);
    // If API fails, return current value
    return creditReportsSubject.getValue();
  }
};

// Dashboard metrics functions
export const updateDashboardMetrics = async (loans, creditScore) => {
  try {
    // Get current metrics
    const currentMetrics = dashboardMetricsSubject.getValue();

    // Calculate active loans count
    const activeLoans = loans ? loans.filter(loan => loan.is_active).length : 0;

    // Calculate credit reports generated this month
    const reports = creditReportsSubject.getValue();
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const reportsThisMonth = reports ? reports.filter(report => {
      const reportDate = new Date(report.created_at);
      return reportDate.getMonth() === thisMonth && reportDate.getFullYear() === thisYear;
    }).length : 0;

    // Calculate score change in last 30 days
    let scoreChange = 'N/A';
    if (creditScore) {
      try {
        // Fetch credit score history
        const historyResponse = await axiosInstance.get('/financial/credit-history/');
        const history = historyResponse.data;

        if (history && history.length > 1) {
          // Sort by date (newest first)
          history.sort((a, b) => new Date(b.calculation_date) - new Date(a.calculation_date));

          // Get current score and score from 30 days ago
          const currentScore = history[0].score;

          // Find score from approximately 30 days ago
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          let oldScore = null;
          for (const entry of history) {
            const entryDate = new Date(entry.calculation_date);
            if (entryDate < thirtyDaysAgo) {
              oldScore = entry.score;
              break;
            }
          }

          if (oldScore !== null) {
            const change = currentScore - oldScore;
            scoreChange = change > 0 ? `+${change}` : `${change}`;
          }
        }
      } catch (historyError) {
        console.error('Error fetching credit score history:', historyError);
      }
    }

    // Update metrics
    const updatedMetrics = {
      activeLoans,
      creditReportsGenerated: reportsThisMonth,
      scoreChange
    };

    dashboardMetricsSubject.next(updatedMetrics);
    localStorage.setItem('dashboardMetrics', JSON.stringify(updatedMetrics));

    return updatedMetrics;
  } catch (error) {
    console.error('Error updating dashboard metrics:', error);
    return dashboardMetricsSubject.getValue();
  }
};

// Clear all data (for logout)
export const clearAllData = () => {
  userDataSubject.next(null);
  financialProfileSubject.next(null);
  creditScoreSubject.next(null);
  loansSubject.next([]);
  creditReportsSubject.next([]);
  dashboardMetricsSubject.next({
    activeLoans: 0,
    creditReportsGenerated: 0,
    scoreChange: 'N/A'
  });

  localStorage.removeItem('userInfo');
  localStorage.removeItem('financialProfile');
  localStorage.removeItem('creditScore');
  localStorage.removeItem('loans');
  localStorage.removeItem('creditReports');
  localStorage.removeItem('dashboardMetrics');
};

export default {
  // Observables
  userData$,
  financialProfile$,
  creditScore$,
  loans$,
  creditReports$,
  dashboardMetrics$,

  // User data functions
  updateUserData,

  // Financial profile functions
  fetchFinancialProfile,
  updateFinancialProfile,
  calculateCreditScore,

  // Loan functions
  fetchLoans,
  createLoan,
  deleteLoan,

  // Credit report functions
  fetchCreditReports,

  // Dashboard metrics functions
  updateDashboardMetrics,

  // Synchronization functions
  synchronizeData,
  initializeAllData,

  // Utility functions
  clearAllData
};
