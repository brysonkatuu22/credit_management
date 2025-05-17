import React, { Component } from 'react';
import { Container, Alert, Button, Card } from 'react-bootstrap';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      darkMode: localStorage.getItem('darkMode') === 'true'
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console
    console.error("Error caught by ErrorBoundary:", error, errorInfo);

    // Update state with error details and increment error count
    this.setState(prevState => ({
      error: error,
      errorInfo: errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Check if we should report this error (e.g., to an error tracking service)
    this.reportError(error, errorInfo);
  }

  reportError(error, errorInfo) {
    // In a production app, you would send this to an error reporting service
    // like Sentry, LogRocket, etc.
    // For now, we'll just log it to console with more details
    console.group('Error Report');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo?.componentStack);
    console.error('URL:', window.location.href);
    console.error('User Agent:', navigator.userAgent);
    console.error('Time:', new Date().toISOString());
    console.groupEnd();
  }

  handleRefresh = () => {
    // Clear any cached state that might be causing the error
    sessionStorage.removeItem('lastRoute');

    // Reload the page
    window.location.reload();
  }

  handleGoHome = () => {
    // Clear any cached state that might be causing the error
    sessionStorage.removeItem('lastRoute');
    localStorage.removeItem('currentView');

    // Navigate to dashboard
    window.location.href = '/dashboard';
  }

  handleClearStorage = () => {
    // Keep only essential items like auth token and user info
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    const userInfo = localStorage.getItem('userInfo');
    const darkMode = localStorage.getItem('darkMode');

    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();

    // Restore essential items
    if (token) localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    if (userInfo) localStorage.setItem('userInfo', userInfo);
    if (darkMode) localStorage.setItem('darkMode', darkMode);

    // Reload the page
    window.location.reload();
  }

  render() {
    const { hasError, error, errorInfo, errorCount, darkMode } = this.state;

    if (hasError) {
      // If we've tried to recover multiple times but still have errors,
      // show a more drastic recovery option
      const showClearStorageOption = errorCount > 1;

      // Render a custom fallback UI
      return (
        <div className={`min-h-screen ${darkMode ? 'dark-mode' : 'bg-light'}`}>
          <Container className="py-5">
            <Card className={`border-0 shadow-lg ${darkMode ? 'bg-dark text-white' : ''}`}>
              <Card.Body className="p-5 text-center">
                <FiAlertTriangle size={50} className="text-danger mb-4" />
                <h2 className="text-danger mb-4">Something went wrong</h2>

                <Alert variant={darkMode ? "dark" : "danger"} className="mb-4 text-left">
                  <p>We're sorry, but an error occurred while rendering this page.</p>
                  {error && (
                    <div className="mt-3 p-3 bg-light text-dark rounded">
                      <p className="mb-1">
                        <strong>Error:</strong> {error.toString()}
                      </p>
                      {errorInfo && (
                        <details className="mt-2">
                          <summary>Component Stack</summary>
                          <pre className="mt-2 p-2 bg-dark text-white rounded" style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>
                            {errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </Alert>

                <div className="d-flex flex-column flex-md-row justify-content-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={this.handleRefresh}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FiRefreshCw className="me-2" /> Refresh Page
                  </Button>
                  <Button
                    variant="outline-secondary"
                    size="lg"
                    onClick={this.handleGoHome}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <FiHome className="me-2" /> Go to Dashboard
                  </Button>

                  {showClearStorageOption && (
                    <Button
                      variant="outline-danger"
                      size="lg"
                      onClick={this.handleClearStorage}
                      className="mt-3 mt-md-0 d-flex align-items-center justify-content-center"
                    >
                      Clear Cache & Reload
                    </Button>
                  )}
                </div>

                {showClearStorageOption && (
                  <p className="text-muted mt-3 small">
                    If the problem persists, try clearing the application cache using the button above.
                    This will reset your application state but preserve your login information.
                  </p>
                )}
              </Card.Body>
            </Card>
          </Container>
        </div>
      );
    }

    // If there's no error, render the children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
