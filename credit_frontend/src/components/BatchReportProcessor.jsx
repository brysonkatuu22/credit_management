import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Form, ListGroup, Badge, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import AdminReportAutomation from './AdminReportAutomation';
import './BatchReportProcessor.css';

/**
 * Component for processing multiple user reports in batch
 */
const BatchReportProcessor = ({ onComplete, onCancel }) => {
  const [userEmails, setUserEmails] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState('');
  const [processingPaused, setProcessingPaused] = useState(false);
  const automationRef = useRef(null);

  // Parse emails when input changes
  useEffect(() => {
    if (!userEmails) {
      setEmailList([]);
      return;
    }

    // Split by commas, newlines, or semicolons and trim whitespace
    const emails = userEmails
      .split(/[,;\n]/)
      .map(email => email.trim())
      .filter(email => email.length > 0 && email.includes('@'));

    setEmailList([...new Set(emails)]); // Remove duplicates
  }, [userEmails]);

  // Update overall progress when processing
  useEffect(() => {
    if (emailList.length === 0 || currentIndex < 0) {
      setOverallProgress(0);
      return;
    }

    const progress = Math.round(((currentIndex + 1) / emailList.length) * 100);
    setOverallProgress(progress);
  }, [currentIndex, emailList.length]);

  // Monitor currentIndex changes to ensure batch processing continues
  useEffect(() => {
    // Only proceed if we're in processing mode and have a valid index
    if (isProcessing && currentIndex >= 0 && currentIndex < emailList.length) {
      console.log(`Processing email ${currentIndex + 1}/${emailList.length}: ${emailList[currentIndex]}`);

      // Reset any previous error
      setError('');

      // The AdminReportAutomation component will handle the actual processing
      // It will call either handleReportComplete or handleReportError when done
    }
  }, [currentIndex, isProcessing, emailList]);

  // Start batch processing
  const startProcessing = () => {
    if (emailList.length === 0) {
      setError('Please enter at least one valid email address');
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setCurrentIndex(0);
  };

  // Handle completion of a single report
  const handleReportComplete = (result) => {
    console.log(`Report completed for ${emailList[currentIndex]}`);

    // Add result to the results array
    setResults(prev => [...prev, {
      email: emailList[currentIndex],
      status: 'success',
      reportUrl: result.reportUrl,
      user: result.user
    }]);

    // Move to the next email or finish after a short delay
    // This delay ensures state updates have time to complete
    setTimeout(() => {
      if (currentIndex < emailList.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // All done
        setIsProcessing(false);
        setCurrentIndex(-1);
      }
    }, 500);
  };

  // Handle error in report generation
  const handleReportError = (errorMsg) => {
    console.log(`Error processing report for ${emailList[currentIndex]}: ${errorMsg}`);

    // Add error to the results array
    setResults(prev => [...prev, {
      email: emailList[currentIndex],
      status: 'error',
      error: errorMsg
    }]);

    // Move to the next email or finish after a short delay
    // This delay ensures state updates have time to complete
    setTimeout(() => {
      if (currentIndex < emailList.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // All done
        setIsProcessing(false);
        setCurrentIndex(-1);
      }
    }, 500);
  };

  // Cancel batch processing
  const cancelProcessing = () => {
    setIsProcessing(false);
    setCurrentIndex(-1);
    if (onCancel) onCancel();
  };

  // Complete batch processing
  const finishProcessing = () => {
    if (onComplete) onComplete(results);
  };

  return (
    <Card className="mb-4 shadow-sm batch-processor">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">Batch Report Generation</h5>
      </Card.Header>
      <Card.Body className="batch-processor-body">
        {!isProcessing ? (
          <>
            <div className="batch-intro">
              <div className="batch-icon mb-3">
                <i className="fas fa-file-alt"></i>
              </div>
              <p className="text-muted mb-3">
                Enter multiple email addresses separated by commas, semicolons, or new lines to generate reports for multiple users at once.
              </p>
            </div>

            <Form.Group className="mb-4">
              <Form.Label className="fw-bold">User Emails</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                className="email-textarea blue-focus"
                placeholder="user1@example.com, user2@example.com, user3@example.com"
                value={userEmails}
                onChange={(e) => setUserEmails(e.target.value)}
                disabled={isProcessing}
              />
              <Form.Text className="text-primary">
                {emailList.length} valid email{emailList.length !== 1 ? 's' : ''} found
              </Form.Text>
            </Form.Group>

            {error && (
              <Alert variant="danger" className="mb-3">
                {error}
              </Alert>
            )}

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-secondary"
                onClick={onCancel}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={startProcessing}
                disabled={emailList.length === 0}
                className="px-4"
              >
                <i className="fas fa-play me-2"></i>
                Start Batch Processing
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="batch-processing-header mb-4">
              <h5 className="text-primary mb-3">Batch Processing in Progress</h5>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">Overall Progress:</span>
                <span className="badge bg-primary">{overallProgress}%</span>
              </div>
              <ProgressBar
                now={overallProgress}
                variant="primary"
                className="mb-2 batch-progress"
                animated
              />
              <div className="text-center text-primary fw-bold small">
                Processing {currentIndex + 1} of {emailList.length} emails
              </div>
            </div>

            <div className="mb-4 current-processing-container">
              <h6 className="text-primary">Currently Processing:</h6>
              <div className="p-3 border rounded current-processing processing-animation">
                <div className="d-flex align-items-center">
                  <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                  <span className="fw-bold">{emailList[currentIndex]}</span>
                </div>

                {/* Show the automation for the current email */}
                <div className="mt-3" ref={automationRef}>
                  <AdminReportAutomation
                    userEmail={emailList[currentIndex]}
                    onComplete={handleReportComplete}
                    onError={handleReportError}
                    autoDownload={true}
                  />
                </div>
              </div>
            </div>

            {results.length > 0 && (
              <div className="mb-4 processed-reports-container">
                <h6 className="text-primary">Processed Reports:</h6>
                <ListGroup className="report-list">
                  {results.map((result, index) => (
                    <ListGroup.Item
                      key={index}
                      className="d-flex justify-content-between align-items-center report-item"
                      variant={result.status === 'success' ? 'light' : 'light'}
                    >
                      <div>
                        <span className="fw-bold">{result.email}</span>
                        {result.status === 'success' && result.user && (
                          <span className="text-muted ms-2 small">
                            ({result.user.first_name} {result.user.last_name})
                          </span>
                        )}
                      </div>
                      <div>
                        {result.status === 'success' ? (
                          <>
                            <Badge bg="success" className="me-2">Success</Badge>
                            <a
                              href={`http://127.0.0.1:8000${result.reportUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-primary download-btn"
                            >
                              <i className="fas fa-download me-1"></i> Download
                            </a>
                          </>
                        ) : (
                          <Badge bg="danger">Failed</Badge>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>

                {/* Summary statistics */}
                {results.length >= 2 && (
                  <div className="batch-summary mt-3">
                    <h6 className="text-primary">Batch Summary</h6>
                    <div className="summary-item">
                      <span className="summary-label">Total Processed:</span>
                      <span className="summary-value">{results.length}</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Successful:</span>
                      <span className="summary-value success">
                        {results.filter(r => r.status === 'success').length}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Failed:</span>
                      <span className="summary-value error">
                        {results.filter(r => r.status === 'error').length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="d-flex justify-content-end gap-2">
              <Button
                variant="outline-warning"
                onClick={cancelProcessing}
                className="px-4"
              >
                <i className="fas fa-stop me-2"></i>
                Cancel Processing
              </Button>
              {currentIndex === -1 && results.length > 0 && (
                <Button
                  variant="success"
                  onClick={finishProcessing}
                  className="px-4"
                >
                  <i className="fas fa-check me-2"></i>
                  Complete
                </Button>
              )}
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default BatchReportProcessor;
