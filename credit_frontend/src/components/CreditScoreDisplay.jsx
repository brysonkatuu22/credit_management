import React, { useState } from 'react';
import { Card, Row, Col, ProgressBar, Badge, Button, Modal } from 'react-bootstrap';
import { FiInfo, FiArrowUp, FiArrowDown, FiMinus, FiDownload, FiShare2, FiDollarSign } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const CreditScoreDisplay = ({ creditScore }) => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  if (!creditScore) {
    return null;
  }

  // Check if the credit score is a fallback or cached value
  if (creditScore.fallback || creditScore.cached) {
    return (
      <Card className="shadow-lg mb-5 border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0 font-weight-bold">Your Credit Score</h3>
          </div>
        </div>
        <Card.Body className="p-5 text-center">
          <div className="py-4">
            <FiInfo size={48} className="text-muted mb-3" />
            <h4>Credit Score Not Calculated Yet</h4>
            <p className="text-muted mb-4">
              To calculate your credit score, please add at least one loan account and complete your financial profile.
              The system requires loan information to accurately assess your credit health.
            </p>
            <div className="d-flex justify-content-center gap-3">
              <Button
                variant="primary"
                as={Link}
                to="/loan-accounts"
                className="d-flex align-items-center"
              >
                <FiDollarSign className="me-2" /> Add Loan Account
              </Button>
              <Button
                variant="outline-primary"
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              >
                Complete Financial Profile
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const { score, category, message, factors } = creditScore;

  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 800) return 'success';
    if (score >= 740) return 'info';
    if (score >= 670) return 'primary';
    if (score >= 580) return 'warning';
    return 'danger';
  };

  // Calculate percentage for progress bar (300-850 scale)
  const calculatePercentage = (score) => {
    const min = 300;
    const max = 850;
    return ((score - min) / (max - min)) * 100;
  };

  // Get gradient colors for score circle
  const getScoreGradient = (score) => {
    if (score >= 800) return 'linear-gradient(135deg, #28a745, #20c997)';
    if (score >= 740) return 'linear-gradient(135deg, #17a2b8, #0dcaf0)';
    if (score >= 670) return 'linear-gradient(135deg, #0d6efd, #6610f2)';
    if (score >= 580) return 'linear-gradient(135deg, #ffc107, #fd7e14)';
    return 'linear-gradient(135deg, #dc3545, #c71f37)';
  };

  // Get text for score explanation
  const getScoreExplanation = (score) => {
    if (score >= 800) return "Exceptional credit score. You're in the top tier of borrowers.";
    if (score >= 740) return "Excellent credit score. You qualify for the best rates and terms.";
    if (score >= 670) return "Good credit score. You should qualify for most loans with competitive rates.";
    if (score >= 580) return "Fair credit score. You may face higher rates or have limited options.";
    return "Poor credit score. You may have difficulty getting approved for credit.";
  };

  return (
    <>
      <Card className="shadow-lg mb-5 border-0 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4">
          <div className="d-flex justify-content-between align-items-center">
            <h3 className="mb-0 font-weight-bold">Your Credit Score</h3>
            <div>
              <Button
                variant="outline-light"
                size="sm"
                className="me-2"
                onClick={() => setShowDetailsModal(true)}
              >
                <FiInfo className="me-1" /> Details
              </Button>
            </div>
          </div>
        </div>

        <Card.Body className="p-0">
          <Row className="g-0">
            <Col md={5} className="text-center p-4 d-flex flex-column justify-content-center align-items-center" style={{ background: 'rgba(0,0,0,0.02)' }}>
              <div className="credit-score-circle mb-3 position-relative">
                <div
                  className="score-circle d-flex align-items-center justify-content-center shadow-lg"
                  style={{
                    width: '220px',
                    height: '220px',
                    borderRadius: '50%',
                    margin: '0 auto',
                    background: getScoreGradient(score),
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div className="bg-white" style={{
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <h1 className="mb-0 display-3 fw-bold" style={{ color: score >= 670 ? '#0d6efd' : score >= 580 ? '#fd7e14' : '#dc3545' }}>{score}</h1>
                    <Badge
                      bg={getScoreColor(score)}
                      className="px-3 py-2 mt-1"
                      style={{ fontSize: '1rem' }}
                    >
                      {category}
                    </Badge>
                  </div>
                </div>

                {/* Animated pulse effect */}
                <div className="position-absolute top-0 start-0 w-100 h-100" style={{
                  animation: 'pulse 2s infinite',
                  background: getScoreGradient(score),
                  borderRadius: '50%',
                  opacity: '0.1',
                  zIndex: '-1'
                }}></div>
              </div>

              <div className="mt-3 w-100">
                <ProgressBar
                  now={calculatePercentage(score)}
                  variant={getScoreColor(score)}
                  className="mb-2"
                  style={{ height: '10px', borderRadius: '5px' }}
                />
                <div className="d-flex justify-content-between">
                  <small className="text-muted">Poor (300)</small>
                  <small className="text-muted">Exceptional (850)</small>
                </div>
              </div>

              <p className="mt-3 text-center fw-bold">
                {getScoreExplanation(score)}
              </p>
            </Col>

            <Col md={7} className="p-4">
              <h4 className="mb-3 fw-bold">Credit Score Analysis</h4>
              <p className="lead">{message}</p>

              {factors && factors.length > 0 && (
                <div className="mt-4">
                  <h5 className="fw-bold">Key Factors Affecting Your Score:</h5>
                  <div className="list-group shadow-sm">
                    {factors.map((factor, index) => {
                      // Determine if factor is positive, negative, or neutral based on text content
                      const isPositive = factor.toLowerCase().includes('excellent') ||
                                        factor.toLowerCase().includes('good') ||
                                        factor.toLowerCase().includes('no public records') ||
                                        factor.toLowerCase().includes('no delinquent');

                      const isNegative = factor.toLowerCase().includes('poor') ||
                                        factor.toLowerCase().includes('high') ||
                                        factor.toLowerCase().includes('short') ||
                                        factor.toLowerCase().includes('few') ||
                                        factor.toLowerCase().includes('limited') ||
                                        factor.toLowerCase().includes('public records present') ||
                                        factor.toLowerCase().includes('delinquent accounts:');

                      const impact = isPositive ? 'positive' : (isNegative ? 'negative' : 'neutral');

                      // Extract the category from the factor text (everything before the colon)
                      const factorParts = factor.split(':');
                      const factorCategory = factorParts[0];
                      const factorDescription = factorParts.length > 1 ? factorParts[1] : '';

                      return (
                        <div key={index} className="list-group-item list-group-item-action">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div>
                              <span className="me-2">
                                {impact === 'positive' ? (
                                  <FiArrowUp className="text-success" />
                                ) : impact === 'negative' ? (
                                  <FiArrowDown className="text-danger" />
                                ) : (
                                  <FiMinus className="text-warning" />
                                )}
                              </span>
                              <strong>{factorCategory}</strong>
                            </div>
                            <Badge
                              bg={impact === 'positive' ? 'success' : impact === 'negative' ? 'danger' : 'warning'}
                              pill
                            >
                              {impact === 'positive' ? 'Positive' : impact === 'negative' ? 'Negative' : 'Neutral'}
                            </Badge>
                          </div>
                          {factorDescription && (
                            <p className="mb-0 ms-4 small text-muted">{factorDescription}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-end mt-4">
                <Button
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => setShowDetailsModal(true)}
                >
                  <FiInfo className="me-1" /> View Full Analysis
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Detailed Analysis Modal */}
      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <Modal.Title>Detailed Credit Score Analysis</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-4">
            <Col md={4} className="text-center">
              <div
                className="score-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: getScoreGradient(score),
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div className="bg-white" style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <h2 className="mb-0 fw-bold" style={{ color: score >= 670 ? '#0d6efd' : score >= 580 ? '#fd7e14' : '#dc3545' }}>{score}</h2>
                  <Badge
                    bg={getScoreColor(score)}
                    className="px-2 py-1 mt-1"
                  >
                    {category}
                  </Badge>
                </div>
              </div>
              <ProgressBar
                now={calculatePercentage(score)}
                variant={getScoreColor(score)}
                className="mb-2"
                style={{ height: '8px', borderRadius: '4px' }}
              />
              <div className="d-flex justify-content-between">
                <small className="text-muted">300</small>
                <small className="text-muted">850</small>
              </div>
            </Col>
            <Col md={8}>
              <h4>What This Means For You</h4>
              <p>{message}</p>
              <div className="mt-3">
                <h5>Loan Approval Chances:</h5>
                <ul className="list-group">
                  {score >= 740 ? (
                    <>
                      <li className="list-group-item list-group-item-success">You qualify for the best interest rates</li>
                      <li className="list-group-item list-group-item-success">High approval chances for premium credit cards</li>
                      <li className="list-group-item list-group-item-success">Favorable terms for mortgages and auto loans</li>
                    </>
                  ) : score >= 670 ? (
                    <>
                      <li className="list-group-item list-group-item-primary">You qualify for good interest rates</li>
                      <li className="list-group-item list-group-item-primary">Good approval chances for most credit cards</li>
                      <li className="list-group-item list-group-item-primary">Reasonable terms for most loans</li>
                    </>
                  ) : score >= 580 ? (
                    <>
                      <li className="list-group-item list-group-item-warning">You may face higher interest rates</li>
                      <li className="list-group-item list-group-item-warning">Limited options for credit cards</li>
                      <li className="list-group-item list-group-item-warning">May need larger down payments for loans</li>
                    </>
                  ) : (
                    <>
                      <li className="list-group-item list-group-item-danger">Difficulty getting approved for credit</li>
                      <li className="list-group-item list-group-item-danger">High interest rates if approved</li>
                      <li className="list-group-item list-group-item-danger">May need secured credit cards to rebuild credit</li>
                    </>
                  )}
                </ul>
              </div>
            </Col>
          </Row>

          <h4 className="mb-3">Score Breakdown</h4>
          <Row>
            <Col md={6}>
              <div className="mb-4">
                <h5>Payment History (35%)</h5>
                <ProgressBar
                  now={creditScore.financial_data?.payment_history * 100 || 0}
                  variant={
                    creditScore.financial_data?.payment_history > 0.9 ? "success" :
                    creditScore.financial_data?.payment_history > 0.7 ? "info" :
                    creditScore.financial_data?.payment_history > 0.5 ? "warning" : "danger"
                  }
                  className="mb-2"
                />
                <p className="small text-muted">
                  Your payment history is {(creditScore.financial_data?.payment_history * 100 || 0).toFixed(0)}% on-time payments.
                  {creditScore.financial_data?.payment_history > 0.9
                    ? " This is excellent for your score."
                    : creditScore.financial_data?.payment_history > 0.7
                    ? " This is good for your score."
                    : " Try to improve this by making all payments on time."}
                </p>
              </div>

              <div className="mb-4">
                <h5>Credit Utilization (30%)</h5>
                <ProgressBar
                  now={creditScore.financial_data?.credit_utilization * 100 || 0}
                  variant={
                    creditScore.financial_data?.credit_utilization < 0.1 ? "success" :
                    creditScore.financial_data?.credit_utilization < 0.3 ? "info" :
                    creditScore.financial_data?.credit_utilization < 0.5 ? "warning" : "danger"
                  }
                  className="mb-2"
                />
                <p className="small text-muted">
                  Your credit utilization is {(creditScore.financial_data?.credit_utilization * 100 || 0).toFixed(0)}%.
                  {creditScore.financial_data?.credit_utilization < 0.1
                    ? " This is excellent for your score."
                    : creditScore.financial_data?.credit_utilization < 0.3
                    ? " This is good for your score."
                    : " Try to keep this below 30% for a better score."}
                </p>
              </div>

              <div className="mb-4">
                <h5>Debt-to-Income Ratio (5%)</h5>
                <ProgressBar
                  now={creditScore.financial_data?.debt_to_income * 100 || 0}
                  variant={
                    creditScore.financial_data?.debt_to_income < 0.2 ? "success" :
                    creditScore.financial_data?.debt_to_income < 0.36 ? "info" :
                    creditScore.financial_data?.debt_to_income < 0.43 ? "warning" : "danger"
                  }
                  className="mb-2"
                />
                <p className="small text-muted">
                  Your debt-to-income ratio is {(creditScore.financial_data?.debt_to_income * 100 || 0).toFixed(0)}%.
                  {creditScore.financial_data?.debt_to_income < 0.2
                    ? " This is excellent for your score."
                    : creditScore.financial_data?.debt_to_income < 0.36
                    ? " This is good for your score."
                    : " Try to keep this below 36% for a better score."}
                </p>
              </div>
            </Col>

            <Col md={6}>
              <div className="mb-4">
                <h5>Credit History Length (15%)</h5>
                <ProgressBar
                  now={Math.min((creditScore.financial_data?.credit_history_length / 7) * 100 || 0, 100)}
                  variant={
                    creditScore.financial_data?.credit_history_length >= 7 ? "success" :
                    creditScore.financial_data?.credit_history_length >= 3 ? "info" :
                    creditScore.financial_data?.credit_history_length >= 1 ? "warning" : "danger"
                  }
                  className="mb-2"
                />
                <p className="small text-muted">
                  Your credit history is {creditScore.financial_data?.credit_history_length || 0} years.
                  {creditScore.financial_data?.credit_history_length >= 7
                    ? " This is excellent for your score."
                    : creditScore.financial_data?.credit_history_length >= 3
                    ? " This is good for your score."
                    : " Longer credit history improves your score."}
                </p>
              </div>

              <div className="mb-4">
                <h5>Credit Mix (10%)</h5>
                <ProgressBar
                  now={creditScore.financial_data?.credit_mix * 100 || 0}
                  variant={
                    creditScore.financial_data?.credit_mix >= 0.8 ? "success" :
                    creditScore.financial_data?.credit_mix >= 0.6 ? "info" :
                    creditScore.financial_data?.credit_mix >= 0.4 ? "warning" : "danger"
                  }
                  className="mb-2"
                />
                <p className="small text-muted">
                  Your credit mix score is {(creditScore.financial_data?.credit_mix * 100 || 0).toFixed(0)}%.
                  {creditScore.financial_data?.credit_mix >= 0.8
                    ? " This is excellent for your score."
                    : creditScore.financial_data?.credit_mix >= 0.6
                    ? " This is good for your score."
                    : " Having different types of credit can improve this."}
                </p>
              </div>

              <div className="mb-4">
                <h5>Public Records & Delinquencies</h5>
                <div className="d-flex justify-content-between mb-2">
                  <span>Public Records:</span>
                  <Badge bg={creditScore.financial_data?.public_records === 0 ? "success" : "danger"}>
                    {creditScore.financial_data?.public_records || 0}
                  </Badge>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Delinquent Accounts:</span>
                  <Badge bg={creditScore.financial_data?.delinquent_accounts === 0 ? "success" : "danger"}>
                    {creditScore.financial_data?.delinquent_accounts || 0}
                  </Badge>
                </div>
                <p className="small text-muted mt-2">
                  {creditScore.financial_data?.public_records === 0 && creditScore.financial_data?.delinquent_accounts === 0
                    ? "You have no negative records, which is excellent for your score."
                    : "Negative records significantly impact your score. These will improve with time and responsible credit use."}
                </p>
              </div>
            </Col>
          </Row>

          <div className="mt-3 d-flex justify-content-between">
            <Button variant="outline-secondary">
              <FiDownload className="me-1" /> Download Report
            </Button>
            <Button variant="outline-primary">
              <FiShare2 className="me-1" /> Share Report
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      <style jsx>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.2;
          }
          100% {
            transform: scale(1);
            opacity: 0.1;
          }
        }
      `}</style>
    </>
  );
};

// Helper function to ensure we have financial data to prevent errors
const ensureFinancialData = (creditScore) => {
  if (!creditScore || !creditScore.financial_data) {
    return {
      payment_history: 0,
      credit_utilization: 0,
      credit_history_length: 0,
      credit_mix: 0,
      debt_to_income: 0,
      public_records: 0,
      delinquent_accounts: 0
    };
  }
  return creditScore.financial_data;
};

export default CreditScoreDisplay;
