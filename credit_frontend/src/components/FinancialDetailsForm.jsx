import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { API_BASE_URL } from '../services/axiosConfig';

const FinancialDetailsForm = ({ onCreditScoreCalculated }) => {
  const [financialData, setFinancialData] = useState({
    income: '',
    age: '',
    employment_length: '',
    debt_to_income: '',
    credit_utilization: '',
    payment_history: '',
    credit_mix: '',
    new_credit: '',
    credit_history_length: '',
    public_records: '',
    loan_amount: '',
    interest_rate: '',
    monthly_payment: '',
    total_accounts: '',
    delinquent_accounts: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

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
        
        const response = await axios.get(`${API_BASE_URL}/financial/profile/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data) {
          // Convert null values to empty strings for form inputs
          const formattedData = {};
          Object.keys(response.data).forEach(key => {
            formattedData[key] = response.data[key] === null ? '' : response.data[key];
          });
          
          setFinancialData(formattedData);
        }
        
        setLoadingProfile(false);
      } catch (err) {
        console.error('Error fetching financial profile:', err);
        if (err.response && err.response.status === 404) {
          // No profile exists yet, that's okay
          setLoadingProfile(false);
        } else {
          setError('Failed to load your financial profile. Please try again.');
          setLoadingProfile(false);
        }
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
    
    setFinancialData({
      ...financialData,
      [name]: value
    });
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields
    const requiredFields = ['income', 'age', 'employment_length', 'debt_to_income', 
                           'credit_utilization', 'payment_history'];
    
    requiredFields.forEach(field => {
      if (!financialData[field]) {
        errors[field] = 'This field is required';
      }
    });
    
    // Numeric validation
    Object.keys(financialData).forEach(key => {
      if (financialData[key] && isNaN(financialData[key])) {
        errors[key] = 'Must be a number';
      }
    });
    
    // Range validations
    if (financialData.age && (financialData.age < 18 || financialData.age > 120)) {
      errors.age = 'Age must be between 18 and 120';
    }
    
    if (financialData.debt_to_income && (financialData.debt_to_income < 0 || financialData.debt_to_income > 1)) {
      errors.debt_to_income = 'Must be between 0 and 1';
    }
    
    if (financialData.credit_utilization && (financialData.credit_utilization < 0 || financialData.credit_utilization > 1)) {
      errors.credit_utilization = 'Must be between 0 and 1';
    }
    
    if (financialData.payment_history && (financialData.payment_history < 0 || financialData.payment_history > 1)) {
      errors.payment_history = 'Must be between 0 and 1';
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
      
      // Convert string values to numbers
      const numericData = {};
      Object.keys(financialData).forEach(key => {
        if (financialData[key] === '') {
          numericData[key] = null;
        } else {
          numericData[key] = Number(financialData[key]);
        }
      });
      
      // Save financial profile
      await axios.put(`${API_BASE_URL}/financial/profile/`, numericData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Calculate credit score
      const scoreResponse = await axios.post(
        `${API_BASE_URL}/financial/calculate-credit-score/`, 
        numericData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess('Financial details saved successfully!');
      
      // Pass credit score data to parent component
      if (onCreditScoreCalculated && scoreResponse.data) {
        onCreditScoreCalculated(scoreResponse.data);
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

  if (loadingProfile) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading your financial profile...</p>
      </div>
    );
  }

  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-blue-700 text-white">
        <h3 className="mb-0">Financial Details</h3>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <h4 className="mb-3">Personal Financial Information</h4>
              
              <Form.Group className="mb-3">
                <Form.Label>Monthly Income (KES)</Form.Label>
                <Form.Control
                  type="number"
                  name="income"
                  value={financialData.income}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.income}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.income}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  value={financialData.age}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.age}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.age}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Employment Length (years)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  name="employment_length"
                  value={financialData.employment_length}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.employment_length}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.employment_length}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Debt-to-Income Ratio (0-1)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="debt_to_income"
                  value={financialData.debt_to_income}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.debt_to_income}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.debt_to_income}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Your total monthly debt payments divided by your monthly income (0.3 = 30%)
                </Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <h4 className="mb-3">Credit Information</h4>
              
              <Form.Group className="mb-3">
                <Form.Label>Credit Utilization (0-1)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="credit_utilization"
                  value={financialData.credit_utilization}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.credit_utilization}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.credit_utilization}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  How much of your available credit you're using (0.3 = 30%)
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Payment History (0-1)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="payment_history"
                  value={financialData.payment_history}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.payment_history}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.payment_history}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Percentage of on-time payments (0.9 = 90% on-time)
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Credit Mix (0-1)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="credit_mix"
                  value={financialData.credit_mix}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.credit_mix}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.credit_mix}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Credit History Length (years)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  name="credit_history_length"
                  value={financialData.credit_history_length}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.credit_history_length}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.credit_history_length}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mt-3">
            <Col md={6}>
              <h4 className="mb-3">Additional Information</h4>
              
              <Form.Group className="mb-3">
                <Form.Label>Public Records (defaults, bankruptcies)</Form.Label>
                <Form.Control
                  type="number"
                  name="public_records"
                  value={financialData.public_records}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.public_records}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.public_records}
                </Form.Control.Feedback>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>New Credit Applications</Form.Label>
                <Form.Control
                  type="number"
                  step="0.01"
                  name="new_credit"
                  value={financialData.new_credit}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.new_credit}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.new_credit}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <h4 className="mb-3">Loan Information</h4>
              
              <Form.Group className="mb-3">
                <Form.Label>Total Loan Amount (KES)</Form.Label>
                <Form.Control
                  type="number"
                  name="loan_amount"
                  value={financialData.loan_amount}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.loan_amount}
                  readOnly
                />
                <Form.Text className="text-muted">
                  This is calculated from your loan accounts
                </Form.Text>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Total Monthly Payment (KES)</Form.Label>
                <Form.Control
                  type="number"
                  name="monthly_payment"
                  value={financialData.monthly_payment}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.monthly_payment}
                  readOnly
                />
                <Form.Text className="text-muted">
                  This is calculated from your loan accounts
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-end mt-4">
            <Button 
              variant="primary" 
              type="submit" 
              disabled={loading}
              className="px-4"
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
                  Saving...
                </>
              ) : (
                'Save & Calculate Credit Score'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FinancialDetailsForm;
