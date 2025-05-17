import React, { useState } from 'react';
import { Alert, Button, Card, Collapse } from 'react-bootstrap';
import { FiAlertTriangle, FiChevronDown, FiChevronUp, FiCopy, FiInfo } from 'react-icons/fi';

/**
 * A component to display detailed error information for debugging
 *
 * @param {Object} props
 * @param {Error|Object} props.error - The error object to display
 * @param {string} props.message - Optional custom message to display
 * @param {string} props.genericMessage - Generic message to show by default
 * @param {string} props.variant - Bootstrap variant for the alert (default: 'danger')
 * @param {boolean} props.dismissible - Whether the alert can be dismissed
 * @param {Function} props.onDismiss - Callback when the alert is dismissed
 * @param {boolean} props.showDetails - Whether to show technical details by default
 * @param {boolean} props.showExactError - Whether to show the exact error message by default
 */
const ErrorDetails = ({
  error,
  message,
  genericMessage = 'An error occurred. Please try again.',
  variant = 'danger',
  dismissible = false,
  onDismiss,
  showDetails = false,
  showExactError = false
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(showDetails);
  const [showExactErrorMessage, setShowExactErrorMessage] = useState(showExactError);

  // Get the user-friendly message
  const exactErrorMessage = message || error?.userMessage || error?.message || 'An unknown error occurred';

  // Get technical details
  const technicalDetails = error?.technicalDetails || {
    message: error?.message,
    stack: error?.stack,
    data: error?.response?.data,
    status: error?.response?.status,
    statusText: error?.response?.statusText,
    url: error?.config?.url,
    method: error?.config?.method
  };

  // Format technical details as JSON string
  const technicalDetailsString = JSON.stringify(technicalDetails, null, 2);

  // Copy technical details to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(technicalDetailsString)
      .then(() => {
        alert('Error details copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy error details:', err);
      });
  };

  return (
    <Alert
      variant={variant}
      dismissible={dismissible}
      onClose={onDismiss}
      className="mb-4"
    >
      <div className="d-flex align-items-start">
        <FiAlertTriangle size={24} className="me-3 mt-1 flex-shrink-0" />
        <div className="flex-grow-1">
          <Alert.Heading>Error</Alert.Heading>

          {/* Show either generic message or exact error */}
          <p className="mb-2">
            {showExactErrorMessage ? exactErrorMessage : genericMessage}
          </p>

          {/* Toggle between generic and exact error */}
          <Button
            variant={variant === 'danger' ? 'outline-danger' : `outline-${variant}`}
            size="sm"
            className="mb-3 me-2"
            onClick={() => setShowExactErrorMessage(!showExactErrorMessage)}
          >
            {showExactErrorMessage ? (
              <>
                <FiInfo className="me-1" /> Show Generic Message
              </>
            ) : (
              <>
                <FiInfo className="me-1" /> View Exact Error
              </>
            )}
          </Button>

          {/* Toggle technical details */}
          <Button
            variant={variant === 'danger' ? 'outline-danger' : `outline-${variant}`}
            size="sm"
            className="mb-3"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          >
            {showTechnicalDetails ? (
              <>
                <FiChevronUp className="me-1" /> Hide Technical Details
              </>
            ) : (
              <>
                <FiChevronDown className="me-1" /> Show Technical Details
              </>
            )}
          </Button>

          <Collapse in={showTechnicalDetails}>
            <div>
              <Card className="bg-dark text-white mb-2">
                <Card.Header className="d-flex justify-content-between align-items-center py-2">
                  <span>Technical Details</span>
                  <Button
                    variant="outline-light"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <FiCopy className="me-1" /> Copy
                  </Button>
                </Card.Header>
                <Card.Body className="p-0">
                  <pre className="m-0 p-3" style={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '300px',
                    overflow: 'auto',
                    fontSize: '0.85rem'
                  }}>
                    {technicalDetailsString}
                  </pre>
                </Card.Body>
              </Card>

              <div className="text-muted small">
                <p className="mb-1">
                  <strong>Troubleshooting Tips:</strong>
                </p>
                <ul className="ps-3 mb-0">
                  <li>Check your network connection if you see "Network Error"</li>
                  <li>Verify that the Django server is running</li>
                  <li>Check for any validation errors in your input data</li>
                  <li>Try refreshing the page or logging out and back in</li>
                  <li>Share these technical details with support for assistance</li>
                </ul>
              </div>
            </div>
          </Collapse>
        </div>
      </div>
    </Alert>
  );
};

export default ErrorDetails;
