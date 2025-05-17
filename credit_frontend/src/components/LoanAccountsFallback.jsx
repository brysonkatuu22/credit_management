import React from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { FiAlertCircle, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

/**
 * Fallback component for the LoanAccounts page when it fails to load
 * This provides a user-friendly error message and recovery options
 */
const LoanAccountsFallback = ({ error, onRetry }) => {
  const navigate = useNavigate();
  const isDarkMode = localStorage.getItem('darkMode') === 'true';

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRetry = () => {
    if (onRetry && typeof onRetry === 'function') {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  return (
    <Container className="py-5">
      <Card className={`border-0 shadow-lg ${isDarkMode ? 'bg-dark text-white' : ''}`}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <FiAlertCircle size={50} className="text-warning mb-3" />
            <h2 className={`${isDarkMode ? 'text-warning' : 'text-danger'} mb-3`}>
              Loan Accounts Unavailable
            </h2>
            <p className="lead">
              We're having trouble loading your loan accounts information.
            </p>
          </div>

          <Alert variant={isDarkMode ? "dark" : "warning"} className="mb-4">
            <div className="d-flex">
              <FiAlertCircle size={20} className="me-2 flex-shrink-0 mt-1" />
              <div>
                <p className="mb-0">
                  This could be due to one of the following reasons:
                </p>
                <ul className="mt-2 mb-0">
                  <li>The server is temporarily unavailable</li>
                  <li>Your network connection is unstable</li>
                  <li>You haven't entered your financial information yet</li>
                  <li>There was an error processing your loan data</li>
                </ul>
              </div>
            </div>
          </Alert>

          <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handleRetry}
              className="d-flex align-items-center justify-content-center"
            >
              <FiRefreshCw className="me-2" /> Try Again
            </Button>
            <Button
              variant="outline-secondary"
              size="lg"
              onClick={handleGoToDashboard}
              className="d-flex align-items-center justify-content-center"
            >
              <FiArrowLeft className="me-2" /> Return to Dashboard
            </Button>
          </div>

          <div className="mt-4 pt-3 border-top">
            <h5>Troubleshooting Steps:</h5>
            <ol className="mb-0">
              <li>Check if you've entered your financial information in the Dashboard</li>
              <li>Verify your internet connection is stable</li>
              <li>Try refreshing the page</li>
              <li>Clear your browser cache and try again</li>
              <li>If the problem persists, try again later</li>
            </ol>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoanAccountsFallback;
