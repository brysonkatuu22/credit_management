import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import AdminReportAutomation from '../components/AdminReportAutomation';
import BatchReportProcessor from '../components/BatchReportProcessor';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [reportUrl, setReportUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);
  const [automationEmail, setAutomationEmail] = useState('');
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [batchResults, setBatchResults] = useState([]);

  // Check if user is admin
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo.is_admin) {
      navigate('/dashboard');
    }

    // Check dark mode
    setDarkMode(localStorage.getItem('darkMode') === 'true');
  }, [navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) {
      setError('Please enter an email to search');
      return;
    }

    // If automation is enabled, start the automation process
    if (automationEnabled) {
      setIsAutomating(true);
      setError('');
      setSuccess('');
      setSearchResults([]);
      setSelectedUser(null);
      setReportUrl('');
      setAutomationEmail(searchEmail);
      return;
    }

    // Otherwise, proceed with manual search
    setIsLoading(true);
    setError('');
    setSuccess('');
    setSearchResults([]);
    setSelectedUser(null);
    setReportUrl('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/credit-report/admin/search-users/?email=${searchEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSearchResults(response.data);
      if (response.data.length === 0) {
        setError('No users found with that email');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.error || 'Failed to search users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setReportUrl('');
    setSuccess('');
  };

  const handleGenerateReport = async () => {
    if (!selectedUser) {
      setError('Please select a user first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    setReportUrl('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/credit-report/admin/generate-report/',
        { user_email: selectedUser.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReportUrl(response.data.report_url);
      setSuccess(`Report for ${selectedUser.email} generated successfully`);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.error || 'Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={darkMode ? 'dark-mode' : ''}>
      <Header />
      <Container className="py-4">
        <h1 className="mb-4">Admin Dashboard</h1>
        <p className="text-muted mb-4">
          Welcome to the admin dashboard. As an admin user, you can generate credit reports for users by searching their email address.
        </p>

        <div className="d-flex justify-content-end mb-4">
          <ButtonGroup>
            <Button
              variant={!showBatchProcessor ? "primary" : "outline-primary"}
              onClick={() => setShowBatchProcessor(false)}
            >
              Single User Report
            </Button>
            <Button
              variant={showBatchProcessor ? "primary" : "outline-primary"}
              onClick={() => setShowBatchProcessor(true)}
            >
              Batch Reports
            </Button>
          </ButtonGroup>
        </div>

        {showBatchProcessor ? (
          <BatchReportProcessor
            onComplete={(results) => {
              setBatchResults(results);
              setShowBatchProcessor(false);
              setSuccess(`Successfully processed ${results.filter(r => r.status === 'success').length} out of ${results.length} reports`);
            }}
            onCancel={() => setShowBatchProcessor(false)}
          />
        ) : (
          <Row>
          <Col md={6}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">Search Users</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSearch}>
                  <Form.Group className="mb-3">
                    <Form.Label>User Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter user email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                    />
                    <Form.Text className="text-muted">
                      Enter an email address to search for users.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <div className="d-flex align-items-center">
                      <Form.Check
                        type="switch"
                        id="automation-switch"
                        label="Enable RPA Automation"
                        checked={automationEnabled}
                        onChange={(e) => setAutomationEnabled(e.target.checked)}
                        className="me-2"
                      />
                      <span className="text-muted small">
                        {automationEnabled ?
                          "Automatically generate and download report" :
                          "Manual report generation"}
                      </span>
                    </div>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isLoading || isAutomating}
                    className="w-100"
                  >
                    {isLoading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Searching...
                      </>
                    ) : (
                      'Search Users'
                    )}
                  </Button>
                </Form>

                {error && !isAutomating && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}

                {/* Show automation component when automation is active */}
                {isAutomating && (
                  <div className="mt-4">
                    <Card className="border-primary">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0">RPA Automation in Progress</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="text-center mb-3">
                          <h6>Visual Frontend RPA Demonstration</h6>
                          <p className="text-muted small">Watch as the system automatically searches, selects, generates, and downloads the report</p>
                        </div>
                        <AdminReportAutomation
                          userEmail={automationEmail}
                          onComplete={(result) => {
                            setIsAutomating(false);
                            setSuccess(`Report for ${result.user.email} generated and downloaded successfully`);
                            setReportUrl(result.reportUrl);
                          }}
                          onError={(errorMsg) => {
                            setIsAutomating(false);
                            setError(errorMsg);
                          }}
                          autoDownload={true}
                        />
                      </Card.Body>
                    </Card>
                  </div>
                )}

                {searchResults.length > 0 && !isAutomating && (
                  <div className="mt-4">
                    <h6>Search Results:</h6>
                    <div className="list-group">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          className={`list-group-item list-group-item-action ${
                            selectedUser?.id === user.id ? 'active' : ''
                          }`}
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">{user.email}</h6>
                          </div>
                          <p className="mb-1">
                            {user.first_name} {user.last_name}
                          </p>
                          <small>
                            Joined: {new Date(user.date_joined).toLocaleDateString()}
                          </small>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">Generate Report</h5>
              </Card.Header>
              <Card.Body>
                {isAutomating ? (
                  <div className="text-center py-4">
                    <Alert variant="info">
                      <p className="mb-0">
                        <Spinner animation="border" size="sm" className="me-2" />
                        RPA automation is in progress. The report will be generated and downloaded automatically.
                      </p>
                    </Alert>
                  </div>
                ) : selectedUser ? (
                  <>
                    <div className="mb-4">
                      <h6>Selected User:</h6>
                      <p>
                        <strong>Email:</strong> {selectedUser.email}
                        <br />
                        <strong>Name:</strong> {selectedUser.first_name}{' '}
                        {selectedUser.last_name}
                        <br />
                        <strong>Joined:</strong>{' '}
                        {new Date(selectedUser.date_joined).toLocaleDateString()}
                      </p>
                    </div>

                    <Button
                      variant="success"
                      onClick={handleGenerateReport}
                      disabled={isLoading}
                      className="w-100"
                    >
                      {isLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Generating Report...
                        </>
                      ) : (
                        'Generate Credit Report'
                      )}
                    </Button>

                    {success && (
                      <Alert variant="success" className="mt-3">
                        {success}
                      </Alert>
                    )}

                    {reportUrl && (
                      <div className="mt-3 text-center">
                        <a
                          href={`http://127.0.0.1:8000${reportUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary"
                        >
                          Download Report
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted">
                      {automationEnabled ?
                        "Enter an email and click Search to automatically generate and download a report." :
                        "Search for and select a user to generate their credit report."}
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
        )}
      </Container>
    </div>
  );
};

export default AdminDashboard;
