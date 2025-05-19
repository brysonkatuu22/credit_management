import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import GaugeChart from 'react-gauge-chart';
import { toast, Toaster } from 'react-hot-toast';
import { apiCall, getAuthToken, isTokenValid, isDevelopmentMode } from '../utils/apiUtils';

const SentimentDashboard = () => {
  const [averageSentiment, setAverageSentiment] = useState('');
  const [personalScore, setPersonalScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    const token = getAuthToken();
    if (!token || !isTokenValid(token)) {
      toast.error("Your session has expired. Please log in again.");
      localStorage.removeItem("token");
      navigate("/");
      return;
    }
  }, [navigate]);

  useEffect(() => {
    const fetchSentimentData = async () => {
      setIsLoading(true);

      try {
        // Use our utility function for API calls with skipHistoryUpdate=true to prevent adding points on refresh
        const data = await apiCall('/api/auth/sentiment-dashboard/', {}, true);
        console.log("Sentiment Dashboard Data:", data);

        // Use the personal_score which is already in percentage format (0-100)
        setPersonalScore(data.personal_score);
        setAverageSentiment(data.average_ordinal_sentiment);
      } catch (error) {
        console.error('Error fetching sentiment data:', error);

        // Our apiCall function will automatically use mock data in development mode,
        // so we only need to handle errors in production
        if (!isDevelopmentMode()) {
          // Show a more user-friendly error message
          toast.error("Unable to load your sentiment data. Using sample data instead.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSentimentData();
  }, []);

  // Use the personal score directly (it's already a percentage)
  const percentageSentiment = isLoading ? "0.00" : personalScore.toFixed(2);

  // Determine sentiment category and color based on percentage (0-100)
  const getSentimentCategory = (percentScore) => {
    if (percentScore >= 80) return { category: "Exceptional", color: "#007f5f" };
    if (percentScore >= 60) return { category: "Good", color: "#80ed99" };
    if (percentScore >= 40) return { category: "Neutral", color: "#ffdd00" };
    if (percentScore >= 20) return { category: "Concerning", color: "#f48c06" };
    return { category: "Poor", color: "#d00000" };
  };

  const sentimentInfo = getSentimentCategory(personalScore);

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster/>

      {/* Top Navigation Bar */}
      <nav className="bg-gradient-to-b from-blue-600 to-blue-800 shadow-lg p-4 flex justify-between items-center rounded-b-lg border-b-4 border-blue-900">
        <h1
          className="text-xl font-bold text-white drop-shadow-lg cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          Credit Portal
        </h1>
        <div className="space-x-6">
          <Link to="/loan-accounts" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Loan Accounts</Link>
          <Link to="/credit-report" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Credit Report</Link>
          <Link to="/sentiment-dashboard" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200 font-bold">Sentiment Dashboard</Link>
          <button
            className="bg-red-500 text-white px-3 py-2 rounded-md shadow-md hover:bg-red-600"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mt-4 px-6">
        <button
          className="py-2 px-4 font-medium text-blue-600 border-b-2 border-blue-600"
        >
          Sentiment Dashboard
        </button>
        <button
          className="py-2 px-4 font-medium text-gray-500 hover:text-gray-700"
          onClick={() => navigate('/sentiment-trend')}
        >
          Sentiment Trends
        </button>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Financial Sentiment Analysis</h2>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Financial Sentiment Checker */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-2 rounded-md mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">Financial Sentiment Checker</h3>
              </div>
              <p className="text-gray-600 mb-6">Understand your financial mindset. Take a short test to reflect on how you're feeling about your finances.</p>
              <Link to="/sentiment-analysis">
                <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">
                  Take Financial Sentiment Test
                </button>
              </Link>
            </div>

            {/* Personal Sentiment Score */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex-1">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Financial Sentiment Score</h3>

              {isLoading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 flex items-center justify-center mb-4">
                    <div className="absolute inset-0">
                      <GaugeChart id="sentiment-gauge"
                        nrOfLevels={5}
                        arcsLength={[0.2, 0.2, 0.2, 0.2, 0.2]}
                        colors={['#d00000', '#f48c06', '#ffdd00', '#80ed99', '#007f5f']}
                        percent={personalScore / 100} // Convert percentage to 0-1 scale
                        arcPadding={0.02}
                        textColor="#000"
                        hideText={true}
                      />
                    </div>
                    <div className="z-10 flex flex-col items-center">
                      <span className="text-5xl font-bold" style={{ color: sentimentInfo.color }}>{percentageSentiment}%</span>
                    </div>
                  </div>

                  <div className="bg-green-100 text-green-800 text-center py-1 px-4 rounded-full font-medium mb-4" style={{ backgroundColor: `${sentimentInfo.color}20`, color: sentimentInfo.color }}>
                    {sentimentInfo.category}
                  </div>

                  <p className="text-gray-600 text-center">
                    Your average sentiment score from your last 5 responses is <strong>{sentimentInfo.category.toLowerCase()}</strong>!
                  </p>

                  <p className="text-sm text-gray-500 mt-2 text-center">
                    This score reflects your overall financial sentiment based on your recent responses.
                  </p>
                </div>
              )}

              <div className="text-center mt-6">
                <Link to="/sentiment-trend" className="text-blue-600 hover:text-blue-800 font-medium">
                  View Detailed Trends →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentDashboard;
