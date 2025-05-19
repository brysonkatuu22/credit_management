import React, { useState, useEffect } from 'react';
import { Card, Button, Form, ListGroup, Badge, ProgressBar, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import './BatchReportProcessor.css';

/**
 * A simplified batch processor for generating multiple reports
 * This component uses a direct approach without animations to ensure reliability
 */
const SimpleBatchProcessor = ({ onComplete, onCancel }) => {
  const [userEmails, setUserEmails] = useState('');
  const [emailList, setEmailList] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

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

  // Update progress when processing
  useEffect(() => {
    if (emailList.length === 0) {
      setProgress(0);
      return;
    }

    if (currentIndex >= 0) {
      const progressValue = Math.round(((currentIndex + 1) / emailList.length) * 100);
      setProgress(progressValue);
    } else {
      setProgress(0);
    }
  }, [currentIndex, emailList.length]);

  // Process the next email in the batch
  useEffect(() => {
    if (!isProcessing || currentIndex < 0 || currentIndex >= emailList.length) {
      return;
    }

    console.log(`Processing email ${currentIndex + 1}/${emailList.length}: ${emailList[currentIndex]}`);

    // Process the current email
    processEmail(emailList[currentIndex]);
  }, [isProcessing, currentIndex, emailList]);

  // Start batch processing
  const startProcessing = () => {
    if (emailList.length === 0) {
      setError('Please enter at least one valid email address');
      return;
    }

    setIsProcessing(true);
    setResults([]);
    setCurrentIndex(0);
    setError('');
  };

  // Process a single email
  const processEmail = async (email) => {
    try {
      // Step 1: Search for the user
      const token = localStorage.getItem('token');
      const searchResponse = await axios.get(
        `http://127.0.0.1:8000/api/credit-report/admin/search-users/?email=${email}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (searchResponse.data.length === 0) {
        // User not found, add to results and move to next
        addResult({
          email,
          status: 'error',
          error: `No user found with email: ${email}`
        });
        return;
      }

      const user = searchResponse.data[0];

      // Step 2: Generate report for the user
      const reportResponse = await axios.post(
        'http://127.0.0.1:8000/api/credit-report/admin/generate-report/',
        { user_email: user.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Step 3: Add successful result
      addResult({
        email,
        status: 'success',
        reportUrl: reportResponse.data.report_url,
        user
      });

    } catch (err) {
      console.error(`Error processing email ${email}:`, err);

      // Add error result
      addResult({
        email,
        status: 'error',
        error: err.response?.data?.error || `Failed to process: ${err.message}`
      });
    }
  };

  // Add a result and move to the next email
  const addResult = (result) => {
    // Add timestamp
    result.timestamp = new Date().toISOString();

    // Update results
    setResults(prev => [...prev, result]);

    // Move to next email or finish
    setTimeout(() => {
      if (currentIndex < emailList.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // All done
        finishProcessing();
      }
    }, 500);
  };


  // Finish batch processing
  const finishProcessing = () => {
    setIsProcessing(false);
    setCurrentIndex(-1);

    // Store batch history
    try {
      const history = JSON.parse(localStorage.getItem('batchReportHistory') || '[]');
      history.unshift({
        timestamp: new Date().toISOString(),
        totalCount: results.length,
        successCount: results.filter(r => r.status === 'success').length,
        errorCount: results.filter(r => r.status === 'error').length
      });
      localStorage.setItem('batchReportHistory', JSON.stringify(history.slice(0, 10)));
    } catch (err) {
      console.error('Error saving batch history:', err);
    }

    // Call the onComplete callback
    if (onComplete) {
      onComplete(results);
    }
  };

  // Cancel batch processing
  const cancelProcessing = () => {
    setIsProcessing(false);
    setCurrentIndex(-1);
    if (onCancel) onCancel();
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
                <span className="badge bg-primary">{progress}%</span>
              </div>
              <ProgressBar
                now={progress}
                variant="primary"
                className="mb-2 batch-progress"
                animated
              />
              <div className="text-center text-primary fw-bold small">
                Processing {currentIndex + 1} of {emailList.length} emails
              </div>
            </div>

            {/* Current processing indicator */}
            <div className="mb-4 current-processing-container">
              <h6 className="text-primary">Currently Processing:</h6>
              <div className="p-3 border rounded current-processing">
                <div className="d-flex align-items-center">
                  <Spinner animation="border" size="sm" variant="primary" className="me-2" />
                  <span className="fw-bold">{emailList[currentIndex]}</span>
                </div>
              </div>
            </div>

            {/* Results list */}
            {results.length > 0 && (
              <div className="mb-4 processed-reports-container">
                <h6 className="text-primary">Processed Reports:</h6>
                <ListGroup className="report-list">
                  {results.map((result, index) => (
                    <ListGroup.Item
                      key={index}
                      className="d-flex justify-content-between align-items-center report-item"
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
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default SimpleBatchProcessor;
