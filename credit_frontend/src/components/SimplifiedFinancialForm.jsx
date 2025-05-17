import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { FiInfo, FiDollarSign, FiClock, FiPercent, FiRefreshCw, FiUser, FiAlertCircle } from 'react-icons/fi';
import { getUserFinancialProfile, updateFinancialProfile, calculateCreditScore } from '../services/financialService';
import { financialProfile$, synchronizeData, userData$, loans$ } from '../services/dataService';
import ErrorDetails from './ErrorDetails';
import { Link } from 'react-router-dom';

const SimplifiedFinancialForm = ({ onCreditScoreCalculated }) => {
  // Only include fields that are relevant for credit score calculation
  const [financialData, setFinancialData] = useState({
    income: '',
    age: '',
    employment_length: '',
    monthly_debt_payment: '', // Added monthly debt payment field
    total_credit_limit: '', // Added total credit limit field
    current_credit_balance: '', // Added current credit balance field
    debt_to_income: '', // Calculated automatically
    credit_utilization: '', // Calculated automatically
    payment_history: 0.9, // Default value - can be selected from dropdown
    credit_history_length: '',
    public_records: 0,
    credit_mix: 0.5, // Default value
    new_credit: 0 // Default value
  });

  // Pre-defined income options in increments of 5000
  const incomeOptions = [
    10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000,
    50000, 55000, 60000, 65000, 70000, 75000, 80000, 85000,
    90000, 95000, 100000, 150000, 200000, 250000, 300000
  ];

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [lastError, setLastError] = useState(null); // Store the full error object
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [userName, setUserName] = useState('');

  // Subscribe to user data
  useEffect(() => {
    const userDataSubscription = userData$.subscribe(userData => {
      if (userData) {
        if (userData.name) {
          setUserName(userData.name);
        } else if (userData.email) {
          // Use email as fallback
          setUserName(userData.email.split('@')[0]);
        }
      }
    });

    return () => {
      userDataSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Fetch user's financial profile when component mounts
    const fetchFinancialProfile = async () => {
      try {
        setLoadingProfile(true);
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authentication required');
          setLoadingProfile(false);
          return;
        }

        // Check if we have cached profile data in localStorage
        const cachedProfileJson = localStorage.getItem('financialProfile');
        if (cachedProfileJson) {
          try {
            const cachedProfile = JSON.parse(cachedProfileJson);
            if (cachedProfile) {
              // Convert null values to empty strings for form inputs
              const formattedData = {};
              Object.keys(cachedProfile).forEach(key => {
                // Only include fields we care about
                if (key in financialData) {
                  formattedData[key] = cachedProfile[key] === null ? '' : cachedProfile[key];
                }
              });

              // If we have income and debt-to-income but no monthly debt payment, calculate it
              if (cachedProfile.income && cachedProfile.debt_to_income && !cachedProfile.monthly_debt_payment) {
                formattedData.monthly_debt_payment = (cachedProfile.income * cachedProfile.debt_to_income).toFixed(0);
              }

              // If we have total_credit_limit and current_credit_balance but no credit_utilization, calculate it
              if (cachedProfile.total_credit_limit && cachedProfile.current_credit_balance && !cachedProfile.credit_utilization) {
                formattedData.credit_utilization = (cachedProfile.current_credit_balance / cachedProfile.total_credit_limit).toFixed(2);
              }

              setFinancialData({
                ...financialData, // Keep default values
                ...formattedData // Override with actual data
              });

              // Set loading to false immediately with cached data
              setLoadingProfile(false);
            }
          } catch (e) {
            console.error('Error parsing cached profile:', e);
          }
        }

        // Subscribe to the financial profile observable
        const subscription = financialProfile$.subscribe(profileData => {
          if (profileData) {
            // Convert null values to empty strings for form inputs
            const formattedData = {};
            Object.keys(profileData).forEach(key => {
              // Only include fields we care about
              if (key in financialData) {
                formattedData[key] = profileData[key] === null ? '' : profileData[key];
              }
            });

            // If we have income and debt-to-income but no monthly debt payment, calculate it
            if (profileData.income && profileData.debt_to_income && !profileData.monthly_debt_payment) {
              formattedData.monthly_debt_payment = (profileData.income * profileData.debt_to_income).toFixed(0);
            }

            // If we have total_credit_limit and current_credit_balance but no credit_utilization, calculate it
            if (profileData.total_credit_limit && profileData.current_credit_balance && !profileData.credit_utilization) {
              formattedData.credit_utilization = (profileData.current_credit_balance / profileData.total_credit_limit).toFixed(2);
            }

            setFinancialData({
              ...financialData, // Keep default values
              ...formattedData // Override with actual data
            });

            setLoadingProfile(false);
          }
        });

        // Fetch the financial profile data in the background
        getUserFinancialProfile().catch(err => {
          console.error('Error fetching financial profile:', err);
          // If we already showed data from cache, don't show an error
          if (!cachedProfileJson) {
            if (err.response && err.response.status === 404) {
              // No profile exists yet, that's okay
              setLoadingProfile(false);
            } else {
              setError('Failed to load your financial profile. Please try again.');
              setLoadingProfile(false);
            }
          }
        });

        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error in financial profile setup:', err);
        setError('Failed to load your financial profile. Please try again.');
        setLoadingProfile(false);
      }
    };

    fetchFinancialProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }

    // List of fields that should handle comma-separated numbers
    const numericFields = [
      'income', 'monthly_debt_payment', 'total_credit_limit',
      'current_credit_balance'
    ];

    // Handle numeric inputs with commas
    if (numericFields.includes(name)) {
      // If input contains commas, remove them for processing
      const numericValue = value.replace(/,/g, '');

      // Check if the value is a valid number after removing commas
      if (numericValue === '' || !isNaN(numericValue)) {
        setFinancialData({
          ...financialData,
          [name]: numericValue
        });
      }
    } else {
      setFinancialData({
        ...financialData,
        [name]: value
      });
    }
  };

  // Format number with commas for display
  const formatNumberWithCommas = (number) => {
    if (number === null || number === undefined || number === '') return '';

    // Remove any existing commas first to avoid double-formatting
    const cleanNumber = number.toString().replace(/,/g, '');

    // Format with commas
    return cleanNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Handle slider changes for ratio fields (0-1)
  const handleSliderChange = (e) => {
    const { name, value } = e.target;

    setFinancialData({
      ...financialData,
      [name]: value
    });
  };

  const validateForm = () => {
    const errors = {};

    // Required fields
    const requiredFields = ['income', 'age', 'employment_length', 'monthly_debt_payment'];

    requiredFields.forEach(field => {
      if (!financialData[field]) {
        errors[field] = 'This field is required';
      }
    });

    // Numeric validation
    const numericFields = [
      'income', 'monthly_debt_payment', 'total_credit_limit',
      'current_credit_balance', 'age', 'employment_length',
      'credit_history_length'
    ];

    numericFields.forEach(key => {
      if (financialData[key]) {
        // Remove commas before checking if it's a number
        const valueWithoutCommas = financialData[key].toString().replace(/,/g, '');
        if (isNaN(valueWithoutCommas) || valueWithoutCommas === '') {
          errors[key] = 'Must be a number';
        }
      }
    });

    // Range validations
    if (financialData.age && (financialData.age < 18 || financialData.age > 120)) {
      errors.age = 'Age must be between 18 and 120';
    }

    // Logical validations
    if (financialData.income && financialData.income < 0) {
      errors.income = 'Income cannot be negative';
    }

    if (financialData.employment_length && financialData.employment_length < 0) {
      errors.employment_length = 'Employment length cannot be negative';
    }

    if (financialData.credit_history_length && financialData.credit_history_length < 0) {
      errors.credit_history_length = 'Credit history length cannot be negative';
    }

    if (financialData.public_records && financialData.public_records < 0) {
      errors.public_records = 'Public records cannot be negative';
    }

    if (financialData.monthly_debt_payment && financialData.monthly_debt_payment < 0) {
      errors.monthly_debt_payment = 'Monthly debt payment cannot be negative';
    }

    // Logical relationship validations
    if (financialData.age && financialData.employment_length) {
        const ageValue = Number(financialData.age);
        const employmentValue = Number(financialData.employment_length);

        if (employmentValue > (ageValue - 18)) {
            errors.employment_length = `Employment length cannot exceed ${ageValue - 18} years based on your age`;
        }
    }

    if (financialData.age && financialData.credit_history_length) {
        const ageValue = Number(financialData.age);
        const creditHistoryValue = Number(financialData.credit_history_length);

        if (creditHistoryValue > (ageValue - 18)) {
            errors.credit_history_length = `Credit history length cannot exceed ${ageValue - 18} years based on your age`;
        }
    }

    // Monthly debt payment cannot exceed income
    if (financialData.income && financialData.monthly_debt_payment) {
      const incomeValue = Number(financialData.income.toString().replace(/,/g, ''));
      const debtValue = Number(financialData.monthly_debt_payment.toString().replace(/,/g, ''));

      if (debtValue > incomeValue) {
        errors.monthly_debt_payment = 'Monthly debt payment cannot exceed your income';
      }
    }

    // Calculate debt-to-income ratio automatically if both values are present
    if (financialData.income && financialData.monthly_debt_payment) {
      const incomeValue = Number(financialData.income.toString().replace(/,/g, ''));
      const debtValue = Number(financialData.monthly_debt_payment.toString().replace(/,/g, ''));

      if (incomeValue > 0 && debtValue >= 0) {
        // Update debt-to-income ratio automatically
        const dti = debtValue / incomeValue;
        if (dti !== Number(financialData.debt_to_income)) {
          // Update the state outside of the validation function
          setTimeout(() => {
            setFinancialData(prevData => ({
              ...prevData,
              debt_to_income: dti.toFixed(2)
            }));
          }, 0);
        }
      }
    }

    // Calculate credit utilization automatically if both values are present
    if (financialData.total_credit_limit && financialData.current_credit_balance) {
      const limitValue = Number(financialData.total_credit_limit.toString().replace(/,/g, ''));
      const balanceValue = Number(financialData.current_credit_balance.toString().replace(/,/g, ''));

      if (limitValue > 0 && balanceValue >= 0) {
        // Update credit utilization ratio automatically
        const utilization = balanceValue / limitValue;
        if (utilization !== Number(financialData.credit_utilization)) {
          // Update the state outside of the validation function
          setTimeout(() => {
            setFinancialData(prevData => ({
              ...prevData,
              credit_utilization: utilization.toFixed(2)
            }));
          }, 0);
        }
      }
    }

    // Validate that current credit balance doesn't exceed total credit limit
    if (financialData.total_credit_limit && financialData.current_credit_balance) {
      const limitValue = Number(financialData.total_credit_limit.toString().replace(/,/g, ''));
      const balanceValue = Number(financialData.current_credit_balance.toString().replace(/,/g, ''));

      if (balanceValue > limitValue) {
        errors.current_credit_balance = 'Current balance cannot exceed your total credit limit';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset messages
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      setError('Please correct the errors in the form.');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Convert string values to numbers, handling comma-separated values
      const numericData = {};

      // List of fields that might have comma-separated numbers
      const numericFields = [
        'income', 'monthly_debt_payment', 'total_credit_limit',
        'current_credit_balance'
      ];

      Object.keys(financialData).forEach(key => {
        if (financialData[key] === '') {
          numericData[key] = null;
        } else if (numericFields.includes(key)) {
          // Remove commas for numeric fields
          numericData[key] = Number(financialData[key].toString().replace(/,/g, ''));
        } else {
          numericData[key] = Number(financialData[key]);
        }
      });

      // Ensure debt-to-income ratio is calculated correctly
      if (numericData.income && numericData.monthly_debt_payment) {
        try {
          // Ensure both values are valid numbers
          const income = parseFloat(numericData.income);
          const monthlyDebtPayment = parseFloat(numericData.monthly_debt_payment);

          if (income > 0) {
            // Calculate the ratio but cap it at 1.0 (100%)
            const ratio = monthlyDebtPayment / income;
            // Round to 2 decimal places to ensure it fits in the database field
            numericData.debt_to_income = Math.min(Math.round(ratio * 100) / 100, 1.0);

            if (ratio > 1.0) {
              console.warn(`Debt-to-income ratio exceeds 100% (${(ratio * 100).toFixed(2)}%). Capping at 100%.`);
            }
          } else {
            // If income is 0 or negative, set ratio to 1.0 (100%)
            console.warn('Income is zero or negative. Setting debt-to-income ratio to 100%.');
            numericData.debt_to_income = 1.0;
          }
        } catch (error) {
          console.error('Error calculating debt-to-income ratio:', error);
          // Default to 0.3 (30%) if there's an error
          numericData.debt_to_income = 0.3;
        }
      }

      // Ensure credit utilization is calculated correctly and capped at 1.0 (100%)
      if (numericData.total_credit_limit && numericData.current_credit_balance) {
        try {
          // Ensure both values are valid numbers
          const creditLimit = parseFloat(numericData.total_credit_limit);
          const creditBalance = parseFloat(numericData.current_credit_balance);

          if (creditLimit > 0) {
            // Calculate the ratio but cap it at 1.0 (100%)
            const utilization = creditBalance / creditLimit;
            // Round to 2 decimal places to ensure it fits in the database field
            numericData.credit_utilization = Math.min(Math.round(utilization * 100) / 100, 1.0);

            // If utilization is extremely high, cap the current balance to match the limit
            if (utilization > 1.0) {
              console.warn(`Credit utilization exceeds 100% (${(utilization * 100).toFixed(2)}%). Capping at 100%.`);
              numericData.current_credit_balance = creditLimit;
            }
          } else {
            // If credit limit is 0 or negative, set utilization to 1.0 (100%)
            console.warn('Credit limit is zero or negative. Setting utilization to 100%.');
            numericData.credit_utilization = 1.0;
          }
        } catch (error) {
          console.error('Error calculating credit utilization:', error);
          // Default to 0.5 (50%) if there's an error
          numericData.credit_utilization = 0.5;
        }
      }

      console.log('Saving financial profile with data:', numericData);

      try {
        // Save financial profile using POST
        const profileResponse = await updateFinancialProfile(numericData);
        console.log('Profile saved successfully:', profileResponse);

        // Calculate credit score with the updated data
        // Force a new calculation by adding a timestamp to ensure cache isn't used
        const scoreResponse = await calculateCreditScore({
          ...numericData,
          _timestamp: Date.now() // Add a timestamp to force a new calculation
        });
        console.log('Credit score calculated:', scoreResponse);

        setSuccess('Financial details saved successfully!');

        // Pass credit score data to parent component
        if (onCreditScoreCalculated && scoreResponse) {
          onCreditScoreCalculated(scoreResponse);
        }
      } catch (apiError) {
        console.error('API Error:', apiError);

        // Store the full error object for detailed display
        setLastError(apiError);

        // Use the enhanced error message from the axios interceptor if available
        if (apiError.userMessage) {
          setError(apiError.userMessage);
        } else if (apiError.response) {
          console.error('Response data:', apiError.response.data);
          console.error('Response status:', apiError.response.status);

          // Try to extract a meaningful error message from the response
          if (apiError.response.data && apiError.response.data.detail) {
            setError(apiError.response.data.detail);
          } else if (apiError.response.data && typeof apiError.response.data === 'object') {
            // Extract field-specific errors
            const fieldErrors = Object.entries(apiError.response.data)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            setError(`Validation error: ${fieldErrors}`);
          } else {
            setError(`Server error (${apiError.response.status}): ${JSON.stringify(apiError.response.data)}`);
          }
        } else if (apiError.request) {
          console.error('Request error:', apiError.request);
          setError('Network error. Please check your connection and try again.');
        } else {
          console.error('Error message:', apiError.message);
          setError(`Error: ${apiError.message}`);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error('Error saving financial details:', err);
      setLoading(false);

      if (err.response && err.response.data) {
        setError(`Error: ${err.response.data.detail || JSON.stringify(err.response.data)}`);
      } else {
        setError('Failed to save your financial details. Please try again.');
      }
    }
  };

  // Check if we have any loans
  const [hasLoans, setHasLoans] = useState(false);

  // Subscribe to loans observable to check if any loans exist
  useEffect(() => {
    const loansSubscription = loans$.subscribe(loansData => {
      if (loansData && Array.isArray(loansData) && loansData.length > 0) {
        setHasLoans(true);
      } else {
        setHasLoans(false);
      }
    });

    return () => {
      loansSubscription.unsubscribe();
    };
  }, []);

  if (loadingProfile) {
    // If we've been loading for more than 3 seconds and don't have loans, show the no loans message
    const [showNoLoansMessage, setShowNoLoansMessage] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        if (!hasLoans) {
          setShowNoLoansMessage(true);
        }
      }, 3000);

      return () => clearTimeout(timer);
    }, [hasLoans]);

    if (showNoLoansMessage && !hasLoans) {
      return (
        <Card className="shadow-lg border-0 mb-5">
          <Card.Header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4">
            <h3 className="mb-0">Financial Details</h3>
          </Card.Header>
          <Card.Body className="p-5 text-center">
            <div className="mb-4">
              <FiInfo size={48} className="text-primary mb-3" />
              <h4>Loan Information Required</h4>
              <p className="text-muted mb-4">
                To display your financial details and calculate your credit score, please add at least one loan account first.
                This helps us provide a more accurate assessment of your financial health.
              </p>
              <div className="d-flex justify-content-center">
                <Button
                  variant="primary"
                  as={Link}
                  to="/loan-accounts"
                  className="d-flex align-items-center"
                >
                  <FiDollarSign className="me-2" /> Add Loan Account
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      );
    }

    return (
      <Card className="shadow-lg border-0 mb-5">
        <Card.Header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4">
          <h3 className="mb-0">Financial Details</h3>
        </Card.Header>
        <Card.Body className="p-5 text-center">
          <Spinner animation="border" role="status" className="mb-3">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <h5 className="mb-3">Loading your financial profile...</h5>
          <p className="text-muted">
            This should only take a moment. If loading persists, please add at least one loan account.
          </p>
          <div className="progress mt-3" style={{ height: '4px' }}>
            <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: '100%' }}></div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 mb-5">
      <Card.Header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <h3 className="mb-0">Financial Details</h3>
            {userName && (
              <div className="ms-3 d-flex align-items-center bg-white bg-opacity-10 px-3 py-1 rounded">
                <FiUser className="me-2 text-white" />
                <span className="text-white">
                  {userName}'s Profile
                </span>
              </div>
            )}
          </div>
          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              size="sm"
              onClick={async () => {
                try {
                  setLoading(true);
                  setError('');
                  setSuccess('');
                  await synchronizeData();
                  setSuccess('Data synchronized successfully across all modules!');
                  setLoading(false);
                } catch (error) {
                  console.error('Error synchronizing data:', error);
                  setError('Failed to synchronize data. Please try again.');
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              <FiRefreshCw className={`me-1 ${loading ? 'animate-spin' : ''}`} /> Sync Data
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
            >
              <FiInfo className="me-1" /> {showHelp ? 'Hide Help' : 'Show Help'}
            </Button>
          </div>
        </div>
      </Card.Header>

      {showHelp && (
        <Alert variant="info" className="m-3">
          <h5>How to use this form:</h5>
          <p>
            Enter your financial information to calculate your credit score. Only the most important
            factors affecting your credit score are included. The more accurate your information,
            the more accurate your credit score will be.
          </p>
          <ul>
            <li>Use the sliders for ratio values (they range from 0% to 100%)</li>
            <li>For income, enter your monthly income in KES</li>
            <li>For employment length and credit history, enter values in years</li>
          </ul>
        </Alert>
      )}

      <Card.Body className="p-4">
        {error && (
          <ErrorDetails
            error={lastError}
            message={error}
            genericMessage="An error occurred while processing your financial information. Please try again."
            showDetails={false}
            showExactError={false}
          />
        )}
        {success && <Alert variant="success">{success}</Alert>}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-light">
                  <h4 className="mb-0 text-primary d-flex align-items-center">
                    <FiDollarSign className="me-2" /> Personal Financial Information
                  </h4>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-4">
                    <Form.Label>Monthly Income (KES)</Form.Label>
                    <div className="mb-2">
                      <div className="input-group">
                        <span className="input-group-text">KES</span>
                        <Form.Control
                          type="text"
                          name="income"
                          value={formatNumberWithCommas(financialData.income)}
                          onChange={handleChange}
                          min="0"
                          placeholder="Enter your monthly income"
                          isInvalid={!!validationErrors.income}
                          className="form-control-lg"
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.income}
                        </Form.Control.Feedback>
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="d-block mb-2 small text-muted">Or select a predefined amount:</label>
                      <div className="d-flex flex-wrap gap-2">
                        {[20000, 50000, 100000, 150000, 200000].map(amount => (
                          <Button
                            key={amount}
                            variant={Number(financialData.income) === amount ? "primary" : "outline-secondary"}
                            size="sm"
                            onClick={() => setFinancialData({
                              ...financialData,
                              income: amount.toString()
                            })}
                            className="flex-grow-0"
                          >
                            {formatNumberWithCommas(amount)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Form.Text className="text-muted">
                      Your total monthly income before taxes
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Age (years)</Form.Label>
                    <Form.Select
                      name="age"
                      value={financialData.age}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.age}
                    >
                      <option value="">Select your age</option>
                      {Array.from({ length: 83 }, (_, i) => i + 18).map(age => (
                        <option key={age} value={age}>{age} years</option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.age}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Employment Length (years)</Form.Label>
                    <Form.Select
                      name="employment_length"
                      value={financialData.employment_length}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.employment_length}
                    >
                      <option value="">Select employment length</option>
                      <option value="0.5">Less than 1 year</option>
                      <option value="1">1 year</option>
                      <option value="2">2 years</option>
                      <option value="3">3 years</option>
                      <option value="4">4 years</option>
                      <option value="5">5 years</option>
                      <option value="7">7 years</option>
                      <option value="10">10 years</option>
                      <option value="15">15+ years</option>
                      <option value="20">20+ years</option>
                      <option value="25">25+ years</option>
                      <option value="30">30+ years</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {validationErrors.employment_length}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted mt-1">
                      How long you've been at your current job
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Monthly Debt Payments (KES)</Form.Label>
                    <div className="mb-2">
                      <div className="input-group">
                        <span className="input-group-text">KES</span>
                        <Form.Control
                          type="text"
                          name="monthly_debt_payment"
                          value={formatNumberWithCommas(financialData.monthly_debt_payment)}
                          onChange={handleChange}
                          min="0"
                          max={financialData.income || Infinity}
                          placeholder="Enter your monthly debt payments"
                          isInvalid={!!validationErrors.monthly_debt_payment}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.monthly_debt_payment}
                        </Form.Control.Feedback>
                      </div>
                    </div>

                    <div className="mb-2">
                      <label className="d-block mb-2 small text-muted">Or select a predefined amount:</label>
                      <div className="d-flex flex-wrap gap-2">
                        {[0, 5000, 10000, 15000, 20000].map(amount => (
                          <Button
                            key={amount}
                            variant={Number(financialData.monthly_debt_payment) === amount ? "primary" : "outline-secondary"}
                            size="sm"
                            onClick={() => setFinancialData({
                              ...financialData,
                              monthly_debt_payment: amount.toString()
                            })}
                            className="flex-grow-0"
                          >
                            {formatNumberWithCommas(amount)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Form.Text className="text-muted">
                      Total monthly payments for all loans, credit cards, and other debts
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="h-100 shadow-sm border-0">
                <Card.Header className="bg-light">
                  <h4 className="mb-0 text-primary d-flex align-items-center">
                    <FiPercent className="me-2" /> Credit Factors
                  </h4>
                </Card.Header>
                <Card.Body>
                  {/* Credit Limit and Balance Fields */}
                  <Form.Group className="mb-4">
                    <Form.Label>Total Credit Limit (KES)</Form.Label>
                    <div className="mb-2">
                      <div className="input-group">
                        <span className="input-group-text">KES</span>
                        <Form.Control
                          type="text"
                          name="total_credit_limit"
                          value={formatNumberWithCommas(financialData.total_credit_limit)}
                          onChange={handleChange}
                          min="0"
                          placeholder="Enter your total credit limit"
                          isInvalid={!!validationErrors.total_credit_limit}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.total_credit_limit}
                        </Form.Control.Feedback>
                      </div>
                    </div>
                    <Form.Text className="text-muted">
                      The total limit across all your credit cards and lines of credit
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label>Current Credit Balance (KES)</Form.Label>
                    <div className="mb-2">
                      <div className="input-group">
                        <span className="input-group-text">KES</span>
                        <Form.Control
                          type="text"
                          name="current_credit_balance"
                          value={formatNumberWithCommas(financialData.current_credit_balance)}
                          onChange={handleChange}
                          min="0"
                          max={financialData.total_credit_limit || Infinity}
                          placeholder="Enter your current balance"
                          isInvalid={!!validationErrors.current_credit_balance}
                        />
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.current_credit_balance}
                        </Form.Control.Feedback>
                      </div>
                    </div>
                    <Form.Text className="text-muted">
                      The current total balance on all your credit cards and lines of credit
                    </Form.Text>
                  </Form.Group>

                  {/* Automatically Calculated Debt-to-Income Ratio */}
                  <Form.Group className="mb-4">
                    <Form.Label className="d-flex justify-content-between align-items-center">
                      <span>Debt-to-Income Ratio</span>
                      <span className="badge bg-primary">
                        {financialData.debt_to_income ? (financialData.debt_to_income * 100).toFixed(0) : '0'}%
                      </span>
                    </Form.Label>
                    <div className="progress" style={{ height: '20px' }}>
                      <div
                        className={`progress-bar ${
                          financialData.debt_to_income > 0.5 ? 'bg-danger' :
                          financialData.debt_to_income > 0.3 ? 'bg-warning' : 'bg-success'
                        }`}
                        role="progressbar"
                        style={{ width: `${financialData.debt_to_income * 100 || 0}%` }}
                        aria-valuenow={financialData.debt_to_income * 100 || 0}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {financialData.debt_to_income ? (financialData.debt_to_income * 100).toFixed(0) : '0'}%
                      </div>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mt-1 mb-2">
                      <span>Good: 0-30%</span>
                      <span>Fair: 30-50%</span>
                      <span>Poor: 50%+</span>
                    </div>
                    <Alert variant="info" className="p-2 small">
                      <strong>Automatically calculated</strong> from your monthly income and debt payments.
                    </Alert>
                  </Form.Group>

                  {/* Automatically Calculated Credit Utilization */}
                  <Form.Group className="mb-4">
                    <Form.Label className="d-flex justify-content-between align-items-center">
                      <span>Credit Utilization</span>
                      <span className="badge bg-primary">
                        {financialData.credit_utilization ? (financialData.credit_utilization * 100).toFixed(0) : '0'}%
                      </span>
                    </Form.Label>
                    <div className="progress" style={{ height: '20px' }}>
                      <div
                        className={`progress-bar ${
                          financialData.credit_utilization > 0.6 ? 'bg-danger' :
                          financialData.credit_utilization > 0.3 ? 'bg-warning' : 'bg-success'
                        }`}
                        role="progressbar"
                        style={{ width: `${financialData.credit_utilization * 100 || 0}%` }}
                        aria-valuenow={financialData.credit_utilization * 100 || 0}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {financialData.credit_utilization ? (financialData.credit_utilization * 100).toFixed(0) : '0'}%
                      </div>
                    </div>
                    <div className="d-flex justify-content-between small text-muted mt-1 mb-2">
                      <span>Excellent: 0-30%</span>
                      <span>Fair: 30-60%</span>
                      <span>Poor: 60%+</span>
                    </div>
                    <Alert variant="info" className="p-2 small">
                      <strong>Automatically calculated</strong> from your credit limit and current balance.
                    </Alert>
                  </Form.Group>

                  {/* Payment History Dropdown */}
                  <Form.Group className="mb-4">
                    <Form.Label>Payment History</Form.Label>
                    <Form.Select
                      name="payment_history"
                      value={financialData.payment_history}
                      onChange={handleChange}
                      isInvalid={!!validationErrors.payment_history}
                    >
                      <option value="1">Excellent (100% on-time payments)</option>
                      <option value="0.95">Very Good (95% on-time payments)</option>
                      <option value="0.9">Good (90% on-time payments)</option>
                      <option value="0.85">Above Average (85% on-time payments)</option>
                      <option value="0.8">Average (80% on-time payments)</option>
                      <option value="0.7">Below Average (70% on-time payments)</option>
                      <option value="0.6">Poor (60% on-time payments)</option>
                      <option value="0.5">Very Poor (50% on-time payments or less)</option>
                    </Form.Select>
                    <Form.Text className="text-muted mt-1">
                      Your history of making payments on time
                    </Form.Text>
                  </Form.Group>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={12} className="mb-4">
              <Card className="shadow-sm border-0">
                <Card.Header className="bg-light">
                  <h4 className="mb-0 text-primary d-flex align-items-center">
                    <FiClock className="me-2" /> Credit History
                  </h4>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label>Credit History Length</Form.Label>
                        <Form.Select
                          name="credit_history_length"
                          value={financialData.credit_history_length}
                          onChange={handleChange}
                          isInvalid={!!validationErrors.credit_history_length}
                        >
                          <option value="">Select credit history length</option>
                          <option value="0.5">Less than 1 year</option>
                          <option value="1">1 year</option>
                          <option value="2">2 years</option>
                          <option value="3">3 years</option>
                          <option value="4">4 years</option>
                          <option value="5">5 years</option>
                          <option value="7">7 years</option>
                          <option value="10">10 years</option>
                          <option value="15">15+ years</option>
                          <option value="20">20+ years</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.credit_history_length}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted mt-1">
                          How long you've had credit accounts
                        </Form.Text>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label>Public Records (defaults, bankruptcies)</Form.Label>
                        <div className="d-flex align-items-center">
                          <div className="btn-group w-100" role="group">
                            {[0, 1, 2, 3, 4, 5].map(value => (
                              <Button
                                key={value}
                                type="button"
                                variant={Number(financialData.public_records) === value ? "primary" : "outline-secondary"}
                                onClick={() => setFinancialData({
                                  ...financialData,
                                  public_records: value
                                })}
                                className="flex-grow-1"
                              >
                                {value}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Form.Control.Feedback type="invalid">
                          {validationErrors.public_records}
                        </Form.Control.Feedback>
                        <Form.Text className="text-muted mt-2">
                          Number of negative public records (defaults, bankruptcies, etc.)
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="d-flex justify-content-center mt-5">
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
              size="lg"
              className="px-5 py-3 shadow-lg"
              style={{ minWidth: '250px' }}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Calculating Score...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="me-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Calculate My Credit Score
                </>
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default SimplifiedFinancialForm;
