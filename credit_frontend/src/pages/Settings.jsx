import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Tab, Button, Alert } from 'react-bootstrap';

const Settings = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const showAlert = (message) => {
    setAlertMessage(message);
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-b from-blue-600 to-blue-800 shadow-lg p-4 flex justify-between items-center rounded-b-lg border-b-4 border-blue-900">
        <h1
          className="text-xl font-bold text-white drop-shadow-lg cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          Credit Portal
        </h1>
        <div className="space-x-6">
          <Link to="/dashboard" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Dashboard</Link>
          <Link to="/loan-accounts" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Loan Accounts</Link>
          <Link to="/credit-report" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Credit Report</Link>
          <Link to="/settings" className="text-white border-b-2 border-white px-3 py-2">Settings</Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition drop-shadow-lg">
            Logout
          </button>
        </div>
      </nav>

      <Container className="py-5">
        {showSuccessAlert && (
          <Alert variant="success" className="mb-4" onClose={() => setShowSuccessAlert(false)} dismissible>
            {alertMessage}
          </Alert>
        )}

        <h2 className="text-3xl font-bold mb-4 text-gray-800">Settings</h2>
        
        <Row>
          <Col md={3}>
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-blue-700 text-white">Settings Menu</Card.Header>
              <Card.Body className="p-0">
                <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
                  <Nav.Item>
                    <Nav.Link eventKey="general" className="rounded-0 border-0">
                      General Settings
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="notifications" className="rounded-0 border-0">
                      Notifications
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="security" className="rounded-0 border-0">
                      Security
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="ml-dashboard" className="rounded-0 border-0">
                      ML Dashboard
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={9}>
            <Card className="shadow-sm">
              <Card.Body>
                <Tab.Content>
                  <Tab.Pane eventKey="general" active={activeTab === 'general'}>
                    <h3 className="mb-4">General Settings</h3>
                    <div className="mb-3">
                      <label className="form-label">Language</label>
                      <select className="form-select">
                        <option>English</option>
                        <option>Swahili</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Currency</label>
                      <select className="form-select">
                        <option>KES (Kenyan Shilling)</option>
                        <option>USD (US Dollar)</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Date Format</label>
                      <select className="form-select">
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                        <option>YYYY-MM-DD</option>
                      </select>
                    </div>
                    <Button 
                      variant="primary" 
                      className="mt-3"
                      onClick={() => showAlert('General settings saved successfully!')}
                    >
                      Save Changes
                    </Button>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="notifications" active={activeTab === 'notifications'}>
                    <h3 className="mb-4">Notification Settings</h3>
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="emailNotifications" defaultChecked />
                      <label className="form-check-label" htmlFor="emailNotifications">
                        Email Notifications
                      </label>
                    </div>
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="smsNotifications" />
                      <label className="form-check-label" htmlFor="smsNotifications">
                        SMS Notifications
                      </label>
                    </div>
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="creditScoreAlerts" defaultChecked />
                      <label className="form-check-label" htmlFor="creditScoreAlerts">
                        Credit Score Change Alerts
                      </label>
                    </div>
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="paymentReminders" defaultChecked />
                      <label className="form-check-label" htmlFor="paymentReminders">
                        Payment Due Reminders
                      </label>
                    </div>
                    <Button 
                      variant="primary" 
                      className="mt-3"
                      onClick={() => showAlert('Notification settings saved successfully!')}
                    >
                      Save Changes
                    </Button>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="security" active={activeTab === 'security'}>
                    <h3 className="mb-4">Security Settings</h3>
                    <div className="mb-3">
                      <label className="form-label">Change Password</label>
                      <input type="password" className="form-control mb-2" placeholder="Current Password" />
                      <input type="password" className="form-control mb-2" placeholder="New Password" />
                      <input type="password" className="form-control" placeholder="Confirm New Password" />
                    </div>
                    <div className="form-check form-switch mb-3">
                      <input className="form-check-input" type="checkbox" id="twoFactorAuth" />
                      <label className="form-check-label" htmlFor="twoFactorAuth">
                        Enable Two-Factor Authentication
                      </label>
                    </div>
                    <Button 
                      variant="primary" 
                      className="mt-3"
                      onClick={() => showAlert('Security settings updated successfully!')}
                    >
                      Update Security Settings
                    </Button>
                  </Tab.Pane>
                  
                  <Tab.Pane eventKey="ml-dashboard" active={activeTab === 'ml-dashboard'}>
                    <h3 className="mb-4">Machine Learning Dashboard</h3>
                    <p className="mb-4">
                      Access detailed analytics and insights about your credit score model, feature importance, 
                      and prediction history.
                    </p>
                    <Button 
                      variant="primary" 
                      onClick={() => navigate('/model-dashboard')}
                    >
                      Open ML Dashboard
                    </Button>
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Settings;
