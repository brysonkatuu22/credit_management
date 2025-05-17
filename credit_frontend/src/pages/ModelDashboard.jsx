import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Alert, Spinner, Badge, Button } from 'react-bootstrap';
import { Bar, Line, Pie, Radar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, RadialLinearScale, Title, Tooltip, Legend, Filler } from 'chart.js';
import { getModelInfo, getCreditHistory } from '../services/mlService';
import { isAuthenticated } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { FiDownload, FiRefreshCw, FiInfo, FiBarChart2 } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ModelDashboard = () => {
  const [modelData, setModelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [modelPerformance, setModelPerformance] = useState({});
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');

  const navigate = useNavigate();

  // Effect to update dark mode when it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setDarkMode(localStorage.getItem('darkMode') === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const fetchModelData = async () => {
      try {
        setLoading(true);

        if (!isAuthenticated()) {
          navigate('/');
          return;
        }

        // Fetch model metadata
        try {
          const modelInfoData = await getModelInfo();
          setModelData(modelInfoData);

          // Set feature importance data
          if (modelInfoData.feature_importance) {
            const features = Object.keys(modelInfoData.feature_importance);
            const importances = Object.values(modelInfoData.feature_importance);

            setFeatureImportance({
              labels: features,
              datasets: [
                {
                  label: 'Feature Importance',
                  data: importances,
                  backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  borderColor: 'rgba(54, 162, 235, 1)',
                  borderWidth: 1,
                },
              ],
            });
          }

          // Set model performance data
          if (modelInfoData.performance_metrics) {
            setModelPerformance(modelInfoData.performance_metrics);
          }
        } catch (modelError) {
          console.error("Error fetching model info:", modelError);
        }

        // Fetch prediction history
        try {
          const historyData = await getCreditHistory();

          if (historyData && historyData.length > 0) {
            // Sort by date
            const sortedHistory = historyData.sort((a, b) =>
              new Date(b.calculation_date) - new Date(a.calculation_date)
            );

            setPredictionHistory(sortedHistory);
          }
        } catch (historyError) {
          console.error("Error fetching credit history:", historyError);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error in data fetching process:", err);
        setError("Failed to load model data. Please try again later.");
        setLoading(false);

        // Set mock data for demonstration
        setMockData();
      }
    };

    fetchModelData();
  }, [navigate]);

  const setMockData = async () => {
    try {
      // Get mock model info from service
      const mockModelInfo = await getModelInfo();
      setModelData(mockModelInfo);

      // Set feature importance data from mock model info
      if (mockModelInfo.feature_importance) {
        const features = Object.keys(mockModelInfo.feature_importance);
        const importances = Object.values(mockModelInfo.feature_importance);

        setFeatureImportance({
          labels: features,
          datasets: [
            {
              label: 'Feature Importance',
              data: importances,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1,
            },
          ],
        });
      }

      // Set model performance data from mock model info
      if (mockModelInfo.performance_metrics) {
        setModelPerformance(mockModelInfo.performance_metrics);
      }

      // Get mock credit history from service
      const mockHistory = await getCreditHistory();
      setPredictionHistory(mockHistory);

    } catch (error) {
      console.error("Error setting mock data:", error);
      setError("Failed to load model data. Please try again later.");
    }
  };

  // Prepare history chart data
  const historyChartData = {
    labels: predictionHistory.map(h => new Date(h.calculation_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Credit Score',
        data: predictionHistory.map(h => h.score),
        fill: false,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1
      }
    ]
  };

  // Options for charts
  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Feature Importance',
      },
    },
  };

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Credit Score History',
      },
    },
    scales: {
      y: {
        min: 300,
        max: 850
      }
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col ${darkMode ? 'dark-mode' : ''}`}>
        <Header />
        <Container className="mt-5 text-center">
          <div className="p-5 bg-white shadow-sm rounded-lg">
            <Spinner animation="border" role="status" variant="primary" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-4 text-lg">Loading model data and analytics...</p>
            <p className="text-muted">This may take a few moments</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex flex-col ${darkMode ? 'dark-mode' : ''}`}>
        <Header />
        <Container className="mt-5">
          <Alert variant="danger">
            <Alert.Heading>Error</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button
                variant="outline-danger"
                onClick={() => window.location.reload()}
              >
                <FiRefreshCw className="me-2" /> Retry
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  // Dark mode is already handled at the top of the component

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark-mode' : ''}`}>
      {/* Header with Navigation */}
      <Header />

      <Container className="py-4 px-4">
        {/* Page Title with Gradient Background */}
        <div className="mb-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 rounded-lg shadow-lg">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-3xl font-bold">Credit Score Model Dashboard</h2>
              <p className="mt-2 opacity-90">
                Analyze your credit score model performance and feature importance
              </p>
            </div>
            <Button
              variant="outline-light"
              className="d-flex align-items-center"
              onClick={() => window.location.reload()}
            >
              <FiRefreshCw className="me-2" /> Refresh Data
            </Button>
          </div>
        </div>

        <Row className="mb-4">
          <Col md={6}>
            <Card className="h-100 shadow-sm border-0">
              <Card.Header as="h5" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                Model Information
              </Card.Header>
              <Card.Body>
                <Table striped bordered hover responsive>
                  <tbody>
                    <tr>
                      <td><strong>Model Type</strong></td>
                      <td>{modelData?.model_type || 'XGBoost Regressor'}</td>
                    </tr>
                    <tr>
                      <td><strong>Version</strong></td>
                      <td>{modelData?.version || '1.0'}</td>
                    </tr>
                    <tr>
                      <td><strong>Last Trained</strong></td>
                      <td>{modelData?.last_trained || '2025-04-30'}</td>
                    </tr>
                    <tr>
                      <td><strong>Number of Estimators</strong></td>
                      <td>{modelData?.n_estimators || 100}</td>
                    </tr>
                    <tr>
                      <td><strong>Max Depth</strong></td>
                      <td>{modelData?.max_depth || 6}</td>
                    </tr>
                    <tr>
                      <td><strong>Learning Rate</strong></td>
                      <td>{modelData?.learning_rate || 0.1}</td>
                    </tr>
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Col>

        <Col md={6}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Header as="h5" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              Model Performance
            </Card.Header>
            <Card.Body>
              <Table striped bordered hover responsive>
                <tbody>
                  <tr>
                    <td><strong>Mean Squared Error (MSE)</strong></td>
                    <td>{modelPerformance?.mse?.toFixed(2) || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Root Mean Squared Error (RMSE)</strong></td>
                    <td>{modelPerformance?.rmse?.toFixed(2) || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>Mean Absolute Error (MAE)</strong></td>
                    <td>{modelPerformance?.mae?.toFixed(2) || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td><strong>R² Score</strong></td>
                    <td>{modelPerformance?.r2?.toFixed(2) || 'N/A'}</td>
                  </tr>
                </tbody>
              </Table>
              <div className="mt-3">
                <Badge
                  bg={modelPerformance?.r2 > 0.5 ? "success" : "warning"}
                  className="p-2 d-flex align-items-center"
                  style={{ width: 'fit-content' }}
                >
                  <FiBarChart2 className="me-1" />
                  Model Quality: {modelPerformance?.r2 > 0.7 ? "Excellent" : modelPerformance?.r2 > 0.5 ? "Good" : "Needs Improvement"}
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={12}>
          <Card className="shadow-sm border-0">
            <Card.Header as="h5" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white d-flex justify-content-between align-items-center">
              <span>Feature Importance</span>
              <Button
                variant="light"
                size="sm"
                onClick={() => window.open('/dashboard', '_self')}
              >
                Update Financial Details
              </Button>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                {featureImportance.labels && (
                  <Bar data={featureImportance} options={barOptions} />
                )}
              </div>
              <div className="mt-3">
                <Alert variant="info" className="d-flex align-items-center">
                  <FiInfo className="me-2" size={20} />
                  <div>
                    <strong>What is Feature Importance?</strong> Feature importance indicates how much each factor contributes to the credit score prediction. Higher values mean the feature has a stronger influence on the final score.
                  </div>
                </Alert>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <Card className="shadow-sm border-0">
            <Card.Header as="h5" className="bg-gradient-to-r from-blue-600 to-blue-700 text-white d-flex justify-content-between align-items-center">
              <span>Your Credit Score History</span>
              <Button
                variant="light"
                size="sm"
                onClick={() => window.open('/credit-report', '_self')}
              >
                Generate New Report
              </Button>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                {predictionHistory.length > 0 && (
                  <Line data={historyChartData} options={lineOptions} />
                )}
              </div>
              {predictionHistory.length === 0 && (
                <Alert variant="warning" className="d-flex align-items-center">
                  <FiInfo className="me-2" size={20} />
                  <div>
                    No credit score history available. Calculate your credit score to see your history.
                  </div>
                </Alert>
              )}

              {predictionHistory.length > 0 && (
                <div className="mt-4">
                  <h5>Recent Calculations</h5>
                  <Table striped bordered hover responsive className="mt-2">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Income</th>
                        <th>Debt-to-Income</th>
                        <th>Credit Utilization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictionHistory.slice(0, 3).map((record, index) => (
                        <tr key={index}>
                          <td>{new Date(record.calculation_date).toLocaleDateString()}</td>
                          <td>
                            <Badge
                              bg={
                                record.score >= 740 ? "success" :
                                record.score >= 670 ? "primary" :
                                record.score >= 580 ? "warning" : "danger"
                              }
                            >
                              {record.score}
                            </Badge>
                          </td>
                          <td>{record.income?.toLocaleString() || 'N/A'}</td>
                          <td>{(record.debt_to_income * 100).toFixed(1)}%</td>
                          <td>{(record.credit_utilization * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-end mt-4">
        <Button
          variant="outline-primary"
          className="me-2"
          onClick={() => window.open('/dashboard', '_self')}
        >
          Back to Dashboard
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => window.print()}
        >
          <FiDownload className="me-1" /> Export Dashboard
        </Button>
      </div>
    </Container>
    </div>
  );
};

export default ModelDashboard;
