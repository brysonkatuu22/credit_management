import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, ButtonGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import AdminReportAutomation from '../components/AdminReportAutomation';
import BasicBatchProcessor from '../components/BasicBatchProcessor';
import './AdminDashboard.css';

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
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [reportsGeneratedCount, setReportsGeneratedCount] = useState(0);

  // Check if user is admin and fetch active users count
  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (!userInfo.is_admin) {
      navigate('/dashboard');
    }

    // Check dark mode
    setDarkMode(localStorage.getItem('darkMode') === 'true');

    // Fetch active users count
    fetchActiveUsersCount();

    // Check if there's a batch processing message
    const batchMessage = localStorage.getItem('batchProcessingMessage');
    if (batchMessage) {
      setSuccess(batchMessage);
      localStorage.removeItem('batchProcessingMessage');
    }

    // Load reports generated count from localStorage
    try {
      const count = localStorage.getItem('adminReportsGeneratedCount');
      if (count) {
        setReportsGeneratedCount(parseInt(count, 10));
      }
    } catch (err) {
      console.error('Error loading reports count:', err);
    }
  }, [navigate]);

  // Function to fetch active users count
  const fetchActiveUsersCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        'http://127.0.0.1:8000/api/credit-report/admin/active-users-count/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && response.data.count) {
        setActiveUsersCount(response.data.count);
      }
    } catch (err) {
      console.error('Error fetching active users count:', err);
      // Set a fallback count if the API fails
      setActiveUsersCount(0);
    }
  };

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

      // Update reports generated count
      try {
        const currentCount = parseInt(localStorage.getItem('adminReportsGeneratedCount') || '0', 10);
        const newCount = currentCount + 1;
        localStorage.setItem('adminReportsGeneratedCount', newCount.toString());
        setReportsGeneratedCount(newCount);
      } catch (err) {
        console.error('Error updating reports count:', err);
      }
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
        <div className="admin-dashboard-header mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="mb-2 text-primary">Admin Dashboard</h1>
              <p className="text-muted">
                Welcome to the admin dashboard. As an admin user, you can generate credit reports for users by searching their email address.
              </p>
            </div>
            <div className="admin-dashboard-stats d-none d-md-flex">
              <div className="admin-stat-card me-3">
                <div className="stat-icon">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-content">
                  <h3>Active Users</h3>
                  <p className="stat-value">{activeUsersCount || 'N/A'}</p>
                </div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-icon">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-content">
                  <h3>Reports Generated</h3>
                  <p className="stat-value">{reportsGeneratedCount || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end mb-4">
          <ButtonGroup className="admin-tab-buttons">
            <Button
              variant={!showBatchProcessor ? "primary" : "outline-primary"}
              onClick={() => setShowBatchProcessor(false)}
              className="px-4 py-2"
            >
              <i className="fas fa-user me-2"></i>
              Single User Report
            </Button>
            <Button
              variant={showBatchProcessor ? "primary" : "outline-primary"}
              onClick={() => setShowBatchProcessor(true)}
              className="px-4 py-2"
            >
              <i className="fas fa-users me-2"></i>
              Batch Reports
            </Button>
          </ButtonGroup>
        </div>

        {showBatchProcessor ? (
          <BasicBatchProcessor
            onComplete={(results) => {
              // Just reload the page to show updated counts and the success message
              window.location.reload();
            }}
            onCancel={() => setShowBatchProcessor(false)}
          />
        ) : (
          <Row>
          <Col md={6}>
            <Card className="mb-4 admin-card">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0"><i className="fas fa-search me-2"></i>Search Users</h5>
              </Card.Header>
              <Card.Body>
                <Form onSubmit={handleSearch}>
                  <Form.Group className="mb-4">
                    <Form.Label>User Email</Form.Label>
                    <div className="search-input-container">
                      <i className="fas fa-envelope search-icon"></i>
                      <Form.Control
                        type="email"
                        placeholder="Enter user email"
                        value={searchEmail}
                        onChange={(e) => setSearchEmail(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <Form.Text className="text-primary">
                      Enter an email address to search for users.
                    </Form.Text>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <div className="automation-toggle-container p-3 rounded">
                      <div className="d-flex align-items-center justify-content-between">
                        <div>
                          <h6 className="mb-1">RPA Automation</h6>
                          <p className="text-muted small mb-0">
                            {automationEnabled ?
                              "Automatically generate and download report" :
                              "Manual report generation"}
                          </p>
                        </div>
                        <Form.Check
                          type="switch"
                          id="automation-switch"
                          checked={automationEnabled}
                          onChange={(e) => setAutomationEnabled(e.target.checked)}
                          className="automation-switch"
                        />
                      </div>
                    </div>
                  </Form.Group>

                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isLoading || isAutomating}
                    className="w-100 search-button"
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
                      <>
                        <i className="fas fa-search me-2"></i>
                        Search Users
                      </>
                    )}
                  </Button>
                </Form>

                {error && !isAutomating && (
                  <Alert variant="danger" className="mt-3">
                    <i className="fas fa-exclamation-circle me-2"></i>
                    {error}
                  </Alert>
                )}

                {/* Show automation component when automation is active */}
                {isAutomating && (
                  <div className="mt-4">
                    <Card className="automation-card">
                      <Card.Header className="bg-primary text-white">
                        <h6 className="mb-0"><i className="fas fa-robot me-2"></i>RPA Automation in Progress</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="text-center mb-3">
                          <div className="automation-icon mb-2">
                            <i className="fas fa-cogs"></i>
                          </div>
                          <h6>Visual Frontend RPA Demonstration</h6>
                          <p className="text-muted small">Watch as the system automatically searches, selects, generates, and downloads the report</p>
                        </div>
                        <AdminReportAutomation
                          userEmail={automationEmail}
                          onComplete={(result) => {
                            setIsAutomating(false);
                            setSuccess(`Report for ${result.user.email} generated and downloaded successfully`);
                            setReportUrl(result.reportUrl);

                            // Update reports generated count
                            try {
                              const currentCount = parseInt(localStorage.getItem('adminReportsGeneratedCount') || '0', 10);
                              const newCount = currentCount + 1;
                              localStorage.setItem('adminReportsGeneratedCount', newCount.toString());
                              setReportsGeneratedCount(newCount);
                            } catch (err) {
                              console.error('Error updating reports count:', err);
                            }
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
                  <div className="mt-4 search-results-container">
                    <h6 className="text-primary mb-3"><i className="fas fa-list me-2"></i>Search Results:</h6>
                    <div className="list-group search-results">
                      {searchResults.map((user) => (
                        <button
                          key={user.id}
                          className={`list-group-item list-group-item-action user-result-item ${
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
            <Card className="mb-4 admin-card">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0"><i className="fas fa-file-alt me-2"></i>Generate Report</h5>
              </Card.Header>
              <Card.Body>
                {isAutomating ? (
                  <div className="text-center py-4">
                    <Alert variant="info" className="automation-alert">
                      <div className="d-flex align-items-center">
                        <div className="automation-alert-icon me-3">
                          <Spinner animation="border" size="sm" />
                        </div>
                        <div>
                          <p className="mb-0 fw-bold">RPA Automation in Progress</p>
                          <p className="mb-0 small">The report will be generated and downloaded automatically.</p>
                        </div>
                      </div>
                    </Alert>
                  </div>
                ) : selectedUser ? (
                  <>
                    <div className="mb-4 selected-user-card">
                      <div className="user-card-header">
                        <i className="fas fa-user-circle user-icon"></i>
                        <h6>Selected User</h6>
                      </div>
                      <div className="user-card-body">
                        <div className="user-info-item">
                          <span className="info-label">Email:</span>
                          <span className="info-value">{selectedUser.email}</span>
                        </div>
                        <div className="user-info-item">
                          <span className="info-label">Name:</span>
                          <span className="info-value">{selectedUser.first_name} {selectedUser.last_name}</span>
                        </div>
                        <div className="user-info-item">
                          <span className="info-label">Joined:</span>
                          <span className="info-value">{new Date(selectedUser.date_joined).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="success"
                      onClick={handleGenerateReport}
                      disabled={isLoading}
                      className="w-100 generate-button"
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
                        <>
                          <i className="fas fa-file-download me-2"></i>
                          Generate Credit Report
                        </>
                      )}
                    </Button>

                    {success && (
                      <Alert variant="success" className="mt-3 success-alert">
                        <i className="fas fa-check-circle me-2"></i>
                        {success}
                      </Alert>
                    )}

                    {reportUrl && (
                      <div className="mt-3 text-center download-container">
                        <a
                          href={`http://127.0.0.1:8000${reportUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-primary download-button"
                        >
                          <i className="fas fa-download me-2"></i>
                          Download Report
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-5 empty-state">
                    <div className="empty-icon mb-3">
                      <i className="fas fa-search"></i>
                    </div>
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
