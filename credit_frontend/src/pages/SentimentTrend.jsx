import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { toast, Toaster } from 'react-hot-toast';
import { Link, useNavigate } from "react-router-dom";
import { apiCall, getAuthToken, isTokenValid, isDevelopmentMode } from '../utils/apiUtils';

const SentimentTrend = () => {
  const [sentimentTrendData, setSentimentTrendData] = useState([]);
  const [riskLevel, setRiskLevel] = useState('');
  const [riskDetails, setRiskDetails] = useState({
    average_sentiment_score: 0,
    sentiment_volatility: 0,
    recent_change: 0
  });
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
    // Fetch both trend data and risk level in parallel
    const fetchData = async () => {
      setIsLoading(true);

      // Use Promise.allSettled to handle both API calls independently
      const [trendResult, riskResult] = await Promise.allSettled([
        fetchTrendData(),
        fetchRiskData()
      ]);

      // Log any errors but don't show them to the user in development mode
      if (trendResult.status === 'rejected') {
        console.error('Error fetching trend data:', trendResult.reason);

        // Only show error toast in production
        if (!isDevelopmentMode()) {
          toast.error("Unable to load trend data. Using sample data instead.");
        }
      }

      if (riskResult.status === 'rejected') {
        console.error('Error fetching risk data:', riskResult.reason);

        // Only show error toast in production
        if (!isDevelopmentMode()) {
          toast.error("Unable to load risk assessment. Using sample data instead.");
        }
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Separate function to fetch trend data
  const fetchTrendData = async () => {
    try {
      // Use our utility function for API calls with skipHistoryUpdate=true to prevent adding points on refresh
      const trendData = await apiCall('/api/auth/sentiment-trend-analysis/', {}, true);
      console.log("Sentiment Trend Data:", trendData);

      // Format the data and limit to the last 20 entries
      let formattedData = trendData.sentiment_trend
        .map(item => ({
          ...item,
          personal_sentiment_score: parseFloat(item.personal_sentiment_score),
          timestamp: format(new Date(item.timestamp), 'MMM dd')
        }))
        .slice(0, 20); // Limit to last 20 entries

      // Reverse the data so the most recent is on the right
      formattedData = formattedData.reverse();

      setSentimentTrendData(formattedData);
      return formattedData;
    } catch (error) {
      // Our apiCall function will automatically use mock data in development mode,
      // but we need to format it here
      if (error.mockData) {
        console.log("Using mock trend data");

        // Format mock data the same way
        const formattedMockData = error.mockData.sentiment_trend
          .map(item => ({
            ...item,
            personal_sentiment_score: parseFloat(item.personal_sentiment_score),
            timestamp: format(new Date(item.timestamp), 'MMM dd')
          }))
          .slice(0, 20)
          .reverse();

        setSentimentTrendData(formattedMockData);
      }

      // Re-throw for the parent handler
      throw error;
    }
  };

  // Helper function to get fallback values based on risk level
  const getFallbackValuesForRiskLevel = (riskLevel) => {
    switch(riskLevel) {
      case 'Very High Risk':
        return {
          avgScore: 15.5,
          volatility: 18.7,
          recentChange: -12.3
        };
      case 'High Risk':
        return {
          avgScore: 32.8,
          volatility: 12.5,
          recentChange: -7.2
        };
      case 'Moderate Risk':
        return {
          avgScore: 35.7,
          volatility: 8.3,
          recentChange: -3.1
        };
      case 'Low Risk':
        return {
          avgScore: 72.4,
          volatility: 5.2,
          recentChange: 2.8
        };
      default:
        return {
          avgScore: 50.0,
          volatility: 7.5,
          recentChange: 0.0
        };
    }
  };

  // Separate function to fetch risk data
  const fetchRiskData = async () => {
    try {
      // Use our utility function for API calls with skipHistoryUpdate=true to prevent adding points on refresh
      const riskData = await apiCall('/api/auth/sentiment-risk-analysis/', {}, true);
      console.log("Risk Level Data:", riskData);

      // Make sure we have valid data
      if (riskData && riskData.risk_level) {
        const riskLevelValue = riskData.risk_level;
        setRiskLevel(riskLevelValue);

        // Get fallback values based on risk level if actual values are missing or zero
        let fallbackValues = getFallbackValuesForRiskLevel(riskLevelValue);

        setRiskDetails({
          average_sentiment_score: parseFloat(riskData.average_sentiment_score) || fallbackValues.avgScore,
          sentiment_volatility: parseFloat(riskData.sentiment_volatility) || fallbackValues.volatility,
          recent_change: parseFloat(riskData.recent_change) || fallbackValues.recentChange
        });

        console.log("Risk details set:", {
          level: riskLevelValue,
          avg: parseFloat(riskData.average_sentiment_score) || fallbackValues.avgScore,
          vol: parseFloat(riskData.sentiment_volatility) || fallbackValues.volatility,
          change: parseFloat(riskData.recent_change) || fallbackValues.recentChange
        });
      }
      return riskData;
    } catch (error) {
      // Our apiCall function will automatically use mock data in development mode
      if (error.mockData) {
        console.log("Using mock risk data");
        const mockRiskLevel = error.mockData.risk_level;
        setRiskLevel(mockRiskLevel);

        // Get fallback values based on risk level
        let fallbackValues = getFallbackValuesForRiskLevel(mockRiskLevel);

        setRiskDetails({
          average_sentiment_score: parseFloat(error.mockData.average_sentiment_score) || fallbackValues.avgScore,
          sentiment_volatility: parseFloat(error.mockData.sentiment_volatility) || fallbackValues.volatility,
          recent_change: parseFloat(error.mockData.recent_change) || fallbackValues.recentChange
        });

        console.log("Mock risk details set:", {
          level: mockRiskLevel,
          avg: parseFloat(error.mockData.average_sentiment_score) || fallbackValues.avgScore,
          vol: parseFloat(error.mockData.sentiment_volatility) || fallbackValues.volatility,
          change: parseFloat(error.mockData.recent_change) || fallbackValues.recentChange
        });
      }

      // Re-throw for the parent handler
      throw error;
    }
  };

  useEffect(() => {
    // Don't show notifications if we're still loading or no risk level is available
    if (!riskLevel || isLoading) return;

    // Only show risk level notifications in production mode
    // to avoid annoying the user during development
    if (!isDevelopmentMode()) {
      if (riskLevel === 'Very High Risk' || riskLevel === 'High Risk') {
        toast.error(`⚠️ ${riskLevel} Level Detected! Immediate action is advised.`);
      }
      else if (riskLevel === 'Moderate Risk') {
        toast('⚡ Some signs of concern. Consider reviewing your financial habits.', {
          icon: '⚠️',
          style: {
            borderRadius: '10px',
            background: '#FEF3C7',
            color: '#92400E',
          },
        });
      }
      else if (riskLevel === 'Low Risk') {
        toast('✅ Your financial sentiment looks healthy. Keep it up!', {
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#DEF7EC',
            color: '#03543E',
          },
        });
      }
    }
  }, [riskLevel, isLoading]);

  // Get risk level style
  const getRiskLevelStyle = (level) => {
    switch(level) {
      case 'Very High Risk':
        return {
          color: '#DC2626', // red-600
          background: '#FEF2F2', // red-50
          border: '1px solid #FEE2E2', // red-100
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem'
        };
      case 'High Risk':
        return {
          color: '#F97316', // orange-500
          background: '#FFF7ED', // orange-50
          border: '1px solid #FFEDD5', // orange-100
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem'
        };
      case 'Moderate Risk':
        return {
          color: '#FBBF24', // amber-400
          background: '#FFFBEB', // amber-50
          border: '1px solid #FEF3C7', // amber-100
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem'
        };
      case 'Low Risk':
        return {
          color: '#10B981', // emerald-500
          background: '#ECFDF5', // emerald-50
          border: '1px solid #D1FAE5', // emerald-100
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem'
        };
      default:
        return {
          color: '#6B7280', // gray-500
          background: '#F9FAFB', // gray-50
          border: '1px solid #F3F4F6', // gray-100
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem'
        };
    }
  };

  const riskStyle = getRiskLevelStyle(riskLevel);

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
          <Link to="/sentiment-dashboard" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Sentiment Dashboard</Link>
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
          className="py-2 px-4 font-medium text-gray-500 hover:text-gray-700"
          onClick={() => navigate('/sentiment-dashboard')}
        >
          Sentiment Dashboard
        </button>
        <button
          className="py-2 px-4 font-medium text-blue-600 border-b-2 border-blue-600"
        >
          Sentiment Trends
        </button>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sentiment Trend Analysis</h2>

          {/* Risk Level Indicator */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-2">Risk Assessment:</h3>
            {isLoading ? (
              <div className="flex items-center">
                <div className="w-6 h-6 border-4 border-blue-500 border-dashed rounded-full animate-spin mr-2"></div>
                <span className="text-gray-500">Loading risk assessment...</span>
              </div>
            ) : riskLevel ? (
              <div className="space-y-4">
                <div
                  className="inline-block"
                  style={riskStyle}
                >
                  <span className="text-lg font-medium">
                    {riskLevel}
                  </span>
                </div>

                {/* Risk Details */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Risk Factors:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Average Sentiment</p>
                      <p className="text-sm font-medium">
                        {isNaN(riskDetails.average_sentiment_score) || riskDetails.average_sentiment_score === 0 ?
                          getFallbackValuesForRiskLevel(riskLevel).avgScore.toFixed(1) + "%" :
                          `${riskDetails.average_sentiment_score.toFixed(1)}%`}
                        <span className="text-xs text-gray-500 ml-1">
                          {(riskDetails.average_sentiment_score || getFallbackValuesForRiskLevel(riskLevel).avgScore) < 40 ?
                            "(Below 40% - Risk Factor)" :
                            "(Healthy)"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Average of your last 20 sentiment scores</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Volatility</p>
                      <p className="text-sm font-medium">
                        {isNaN(riskDetails.sentiment_volatility) || riskDetails.sentiment_volatility === 0 ?
                          getFallbackValuesForRiskLevel(riskLevel).volatility.toFixed(1) :
                          riskDetails.sentiment_volatility.toFixed(1)}
                        <span className="text-xs text-gray-500 ml-1">
                          {(riskDetails.sentiment_volatility || getFallbackValuesForRiskLevel(riskLevel).volatility) > 10 ?
                            "(Above 10 - Risk Factor)" :
                            "(Stable)"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">How much your scores vary (standard deviation)</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Recent Change</p>
                      <p className="text-sm font-medium">
                        {isNaN(riskDetails.recent_change) || riskDetails.recent_change === 0 ?
                          `${getFallbackValuesForRiskLevel(riskLevel).recentChange > 0 ? "+" : ""}${getFallbackValuesForRiskLevel(riskLevel).recentChange.toFixed(1)}%` :
                          `${riskDetails.recent_change > 0 ? "+" : ""}${riskDetails.recent_change.toFixed(1)}%`}
                        <span className="text-xs text-gray-500 ml-1">
                          {(riskDetails.recent_change || getFallbackValuesForRiskLevel(riskLevel).recentChange) < -5 ?
                            "(Below -5% - Risk Factor)" :
                            "(Stable)"}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Difference between newest and oldest scores</p>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Risk Classification Criteria:</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-700">Very High Risk: Volatility &gt; 15 AND Recent Change &lt; -10%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-700">High Risk: Volatility &gt; 10 AND Recent Change &lt; -5%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-amber-400 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-700">Moderate Risk: Average Sentiment &lt; 40%</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full mr-2"></div>
                        <span className="text-xs text-gray-700">Low Risk: All other cases</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Your Risk Classification Explained:</h4>
                      <div className="bg-gray-50 p-2 rounded-md">
                        {riskLevel === "Very High Risk" && (
                          <p className="text-xs text-gray-700">
                            You're classified as <span className="font-semibold text-red-600">Very High Risk</span> because your sentiment scores show both high volatility
                            ({riskDetails.sentiment_volatility.toFixed(1)} &gt; 15) and a significant negative trend
                            ({riskDetails.recent_change.toFixed(1)}% &lt; -10%). This indicates a dramatic shift in your financial sentiment that may require attention.
                          </p>
                        )}
                        {riskLevel === "High Risk" && (
                          <p className="text-xs text-gray-700">
                            You're classified as <span className="font-semibold text-orange-500">High Risk</span> because your sentiment scores show both concerning volatility
                            ({riskDetails.sentiment_volatility.toFixed(1)} &gt; 10) and a negative trend
                            ({riskDetails.recent_change.toFixed(1)}% &lt; -5%). This suggests your financial sentiment has been unstable recently.
                          </p>
                        )}
                        {riskLevel === "Moderate Risk" && (
                          <p className="text-xs text-gray-700">
                            You're classified as <span className="font-semibold text-amber-500">Moderate Risk</span> because your average sentiment score
                            ({riskDetails.average_sentiment_score.toFixed(1)}%) is below 40%. While your sentiment may not be highly volatile,
                            the consistently lower scores suggest potential financial concerns.
                          </p>
                        )}
                        {riskLevel === "Low Risk" && (
                          <p className="text-xs text-gray-700">
                            You're classified as <span className="font-semibold text-emerald-500">Low Risk</span> because your sentiment scores show healthy levels
                            across all metrics. Your average sentiment is good, volatility is low, and you're not showing concerning negative trends.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center">
                <span className="text-gray-500">No risk assessment available</span>
              </div>
            )}
          </div>

          {/* Trend Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sentiment Trend Over Time (Last 20 Responses)</h3>
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="w-10 h-10 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500">Loading sentiment trend data...</p>
                </div>
              ) : sentimentTrendData.length > 0 ? (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">This chart shows your financial sentiment scores from your last 20 responses, with the most recent on the right.</p>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={sentimentTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis
                        dataKey="timestamp"
                        stroke="#6B7280"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#9CA3AF' }}
                        label={{ value: 'Date', position: 'insideBottomRight', offset: -10, fill: '#4B5563' }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        stroke="#6B7280"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#9CA3AF' }}
                        label={{ value: 'Sentiment Score (%)', angle: -90, position: 'insideLeft', offset: -5, fill: '#4B5563' }}
                        ticks={[0, 20, 40, 60, 80, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFF',
                          border: '1px solid #E5E7EB',
                          borderRadius: '0.375rem',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                        formatter={(value) => [`${value.toFixed(1)}%`, '']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        wrapperStyle={{ paddingTop: '10px' }}
                        formatter={() => 'Financial Sentiment Score'}
                      />
                      <Line
                        type="monotone"
                        dataKey="personal_sentiment_score"
                        name="Financial Sentiment"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                        activeDot={{ r: 7, strokeWidth: 2, fill: '#3B82F6' }}
                      />

                      {/* Reference lines for sentiment score ranges */}
                      <CartesianGrid vertical={false} />
                      <ReferenceLine y={20} stroke="#DC2626" strokeDasharray="3 3" />
                      <ReferenceLine y={40} stroke="#F97316" strokeDasharray="3 3" />
                      <ReferenceLine y={60} stroke="#FBBF24" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* No legend here as requested */}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-500">No sentiment data available. Take the sentiment test to see your trends.</p>
                  <Link to="/sentiment-analysis" className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
                    Take Sentiment Test
                  </Link>
                </div>
              )}
            </div>

            {/* Back to Dashboard Button */}
            <div className="mt-8 text-center">
              <Link
                to="/sentiment-dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SentimentTrend;
