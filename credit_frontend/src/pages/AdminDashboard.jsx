import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

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
                      Enter a full or partial email address to search for users.
                    </Form.Text>
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
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
                        Searching...
                      </>
                    ) : (
                      'Search Users'
                    )}
                  </Button>
                </Form>

                {error && (
                  <Alert variant="danger" className="mt-3">
                    {error}
                  </Alert>
                )}

                {searchResults.length > 0 && (
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
                {selectedUser ? (
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
                      Search for and select a user to generate their credit report.
                    </p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminDashboard;
