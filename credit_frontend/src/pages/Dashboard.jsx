// File: src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import { FiBarChart2, FiDollarSign, FiFileText, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import SimplifiedFinancialForm from "../components/SimplifiedFinancialForm";
import CreditScoreDisplay from "../components/CreditScoreDisplay";
import Header from "../components/Header";
import '../styles/darkMode.css';
import { synchronizeData, initializeAllData } from "../services/dataService";
// Import the subjects directly for updating
import { creditScoreSubject } from "../services/dataService";
// Import the observables for subscribing
import {
  userData$,
  financialProfile$,
  creditScore$,
  loans$,
  dashboardMetrics$
} from "../services/dataService";

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [creditScore, setCreditScore] = useState(null);
  const [userName, setUserName] = useState('');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [error, setError] = useState('');
  const [dashboardMetrics, setDashboardMetrics] = useState({
    activeLoans: 0,
    creditReportsGenerated: 0,
    scoreChange: 'N/A'
  });

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Subscribe to user data observable
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

    // Subscribe to credit score observable
    const creditScoreSubscription = creditScore$.subscribe(score => {
      if (score) {
        setCreditScore(score);
      }
    });

    // Subscribe to loans observable
    const loansSubscription = loans$.subscribe(loansData => {
      // Update active loans count
      if (loansData && Array.isArray(loansData)) {
        // Count only active loans
        const activeLoans = loansData.filter(loan => loan.is_active).length;
        // We could update a state variable here if needed
      }
    });

    // Subscribe to dashboard metrics observable
    const dashboardMetricsSubscription = dashboardMetrics$.subscribe(metrics => {
      if (metrics) {
        setDashboardMetrics(metrics);
      }
    });

    // Initialize all data on component mount - this is the central feeding point
    initializeAllData().catch(error => {
      console.error("Error initializing data:", error);
      setError("Failed to load all financial data. Please try again.");
    });

    // Check dark mode
    setDarkMode(localStorage.getItem('darkMode') === 'true');

    // Cleanup subscriptions on component unmount
    return () => {
      userDataSubscription.unsubscribe();
      creditScoreSubscription.unsubscribe();
      loansSubscription.unsubscribe();
      dashboardMetricsSubscription.unsubscribe();
    };
  }, [token, navigate]);

  const handleCreditScoreCalculated = (scoreData) => {
    // Update the credit score state and also update the observable
    setCreditScore(scoreData);

    // Update the credit score in the subject to ensure it's available throughout the app
    creditScoreSubject.next(scoreData);

    // Log the new score for debugging
    console.log('Credit score updated in Dashboard:', scoreData.score);

    // Clear any cached data hash to ensure future calculations use fresh data
    localStorage.removeItem('creditScoreDataHash');

    // Scroll to the credit score display
    if (scoreData) {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 500);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header with Navigation */}
      <Header />

      <Container className="py-4 px-4">
        {/* Welcome Message */}
        <div className="mb-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 rounded-lg shadow-lg">
          <h2 className="text-3xl font-bold">
            {userName ? `Welcome, ${userName}!` : 'Welcome to Your Financial Dashboard!'}
          </h2>
          <p className="mt-2 opacity-90">
            Track your credit score, manage loan accounts, and generate credit reports to improve your financial health.
          </p>

          {/* Quick Stats */}
          <Row className="mt-4">
            <Col md={3} sm={6} className="mb-3 mb-md-0">
              <div className="bg-blue-600 bg-opacity-40 p-3 pb-4 rounded-lg shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-sm text-white font-medium">Current Credit Score</div>
                    <div className="text-xl font-bold text-white">{creditScore ? creditScore.score : '---'}</div>
                    <div className="text-xs text-white opacity-75 mt-1">Your latest calculated score</div>
                  </div>
                  <div className="bg-blue-500 bg-opacity-50 p-2 rounded-full">
                    <FiBarChart2 size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-3 mb-md-0">
              <div className="bg-green-600 bg-opacity-40 p-3 pb-4 rounded-lg shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-sm text-white font-medium">Active Loans</div>
                    <div className="text-xl font-bold text-white">{dashboardMetrics.activeLoans}</div>
                    <div className="text-xs text-white opacity-75 mt-1">From all institutions</div>
                  </div>
                  <div className="bg-green-500 bg-opacity-50 p-2 rounded-full">
                    <FiDollarSign size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </Col>
            <Col md={3} sm={6} className="mb-3 mb-md-0">
              <div className="bg-purple-600 bg-opacity-40 p-3 pb-4 rounded-lg shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-sm text-white font-medium">Credit Reports</div>
                    <div className="text-xl font-bold text-white">{dashboardMetrics.creditReportsGenerated}</div>
                    <div className="text-xs text-white opacity-75 mt-1">Generated this month</div>
                  </div>
                  <div className="bg-purple-500 bg-opacity-50 p-2 rounded-full">
                    <FiFileText size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </Col>
            <Col md={3} sm={6}>
              <div className="bg-orange-600 bg-opacity-40 p-3 pb-4 rounded-lg shadow-sm">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-sm text-white font-medium">Score Change</div>
                    <div className="text-xl font-bold text-white">
                      {dashboardMetrics.scoreChange !== 'N/A' ? `${dashboardMetrics.scoreChange} pts` : 'N/A'}
                    </div>
                    <div className="text-xs text-white opacity-75 mt-1">Last 30 days</div>
                  </div>
                  <div className="bg-orange-500 bg-opacity-50 p-2 rounded-full">
                    <FiTrendingUp size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            variant="danger"
            className="mb-4"
            onClose={() => setError('')}
            dismissible
          >
            {error}
          </Alert>
        )}

        {/* Credit Score Display (if available) */}
        {creditScore && (
          <CreditScoreDisplay creditScore={creditScore} />
        )}

        {/* Financial Details Form */}
        <SimplifiedFinancialForm onCreditScoreCalculated={handleCreditScoreCalculated} />

        {/* Quick Links */}
        <div className="mt-5">
          <h3 className="text-xl font-semibold mb-3">Quick Actions</h3>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm hover:shadow-md transition-shadow border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="bg-blue-100 text-blue-700 p-3 rounded-lg mb-3 align-self-start">
                    <FiBarChart2 size={24} />
                  </div>
                  <Card.Title>Credit Score Analysis</Card.Title>
                  <Card.Text className="text-muted mb-4">
                    View detailed analysis of your credit score, including factors that affect it and how to improve it.
                  </Card.Text>
                  <Button
                    variant="outline-primary"
                    className="mt-auto"
                    onClick={() => {
                      if (creditScore) {
                        window.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        });
                      } else {
                        setError('Please calculate your credit score first');
                      }
                    }}
                  >
                    View Credit Analysis
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm hover:shadow-md transition-shadow border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="bg-green-100 text-green-700 p-3 rounded-lg mb-3 align-self-start">
                    <FiDollarSign size={24} />
                  </div>
                  <Card.Title>Loan Accounts</Card.Title>
                  <Card.Text className="text-muted mb-4">
                    Manage your loan accounts, view details, and add new loans from different institutions.
                  </Card.Text>
                  <Button
                    variant="outline-success"
                    className="mt-auto"
                    onClick={() => navigate('/loan-accounts')}
                  >
                    Manage Loans
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="h-100 shadow-sm hover:shadow-md transition-shadow border-0">
                <Card.Body className="d-flex flex-column">
                  <div className="bg-purple-100 text-purple-700 p-3 rounded-lg mb-3 align-self-start">
                    <FiFileText size={24} />
                  </div>
                  <Card.Title>Credit Reports</Card.Title>
                  <Card.Text className="text-muted mb-4">
                    Generate comprehensive credit reports based on your financial data and loan history.
                  </Card.Text>
                  <Button
                    variant="outline-primary"
                    className="mt-auto"
                    onClick={() => navigate('/credit-report')}
                  >
                    Generate Report
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default Dashboard;