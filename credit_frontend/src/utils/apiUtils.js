/**
 * Utility functions for API calls and authentication
 */

// Base API URLs to try
const API_URLS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000"
];

/**
 * Get the authentication token from localStorage
 * @returns {string|null} The token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem("token");
};

/**
 * Check if the token is valid (not expired)
 * @param {string} token - The JWT token to check
 * @returns {boolean} Whether the token is valid
 */
export const isTokenValid = (token) => {
  if (!token) return false;

  // First check if we have a stored expiration time
  const storedExpiration = localStorage.getItem("tokenExpiration");
  if (storedExpiration) {
    const expirationTime = parseInt(storedExpiration, 10);
    const currentTime = new Date().getTime();

    // If we have a valid expiration time, use that
    if (!isNaN(expirationTime) && expirationTime > currentTime) {
      return true;
    }
  }

  // Fallback to decoding the token
  try {
    // JWT tokens are in format: header.payload.signature
    const payload = token.split('.')[1];
    if (!payload) return false;

    // Decode the base64 payload
    const decodedPayload = JSON.parse(atob(payload));

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    return decodedPayload.exp > currentTime;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

/**
 * Check if we're in development mode
 * @returns {boolean} Whether we're in development mode
 */
export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Make an authenticated API call with proper error handling
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @param {boolean} skipHistoryUpdate - If true, adds a query param to skip updating history (for dashboard/trend views)
 * @returns {Promise<Object>} The API response data
 */
export const apiCall = async (endpoint, options = {}, skipHistoryUpdate = false) => {
  const token = getAuthToken();

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!isTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiration");
    throw new Error("Authentication token has expired. Please log in again.");
  }

  // Set default headers with authentication
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...options.headers
  };

  // Add query parameter to skip history update if needed
  let modifiedEndpoint = endpoint;
  if (skipHistoryUpdate) {
    modifiedEndpoint += (endpoint.includes('?') ? '&' : '?') + 'skip_history_update=true';
  }

  // Try each API URL until one works
  let lastError = null;

  for (const baseUrl of API_URLS) {
    try {
      const url = `${baseUrl}${modifiedEndpoint}`;
      console.log(`Making API call to: ${url}`);

      const response = await fetch(url, {
        ...options,
        headers
      });

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.detail || `API responded with status: ${response.status}`;

        // Handle specific error codes
        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("tokenExpiration");
          throw new Error("Authentication failed. Please log in again.");
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error calling ${baseUrl}${modifiedEndpoint}:`, error);
      lastError = error;
    }
  }

  // If we're in development mode, don't throw an error
  // Instead, return mock data based on the endpoint
  if (isDevelopmentMode()) {
    console.log(`All API URLs failed. Using mock data for ${endpoint}`);

    let mockData;
    if (endpoint.includes('sentiment-dashboard')) {
      mockData = generateMockData('dashboard');
    } else if (endpoint.includes('sentiment-trend-analysis')) {
      mockData = generateMockData('trend');
    } else if (endpoint.includes('sentiment-risk-analysis')) {
      mockData = generateMockData('risk');
    } else {
      // Generic mock data for other endpoints
      mockData = { success: true, message: "This is mock data for development" };
    }

    return mockData;
  }

  // If we get here, all API URLs failed and we're not in development mode
  // Create a custom error with mock data attached
  const error = new Error(`Failed to connect to API. Please try again later.`);

  // Attach mock data to the error object for components to use if needed
  if (endpoint.includes('sentiment-dashboard')) {
    error.mockData = generateMockData('dashboard');
  } else if (endpoint.includes('sentiment-trend-analysis')) {
    error.mockData = generateMockData('trend');
  } else if (endpoint.includes('sentiment-risk-analysis')) {
    error.mockData = generateMockData('risk');
  }

  throw error || lastError;
};

/**
 * Generate mock data for development when API calls fail
 * @param {string} type - The type of mock data to generate
 * @returns {Object} Mock data object
 */
export const generateMockData = (type) => {
  switch (type) {
    case 'dashboard':
      return {
        personal_score: 75.5,
        average_intensity_score: 0.51,
        average_ordinal_sentiment: "Positive"
      };

    case 'trend':
      // Generate 20 days of mock data
      const mockTrendData = {
        sentiment_trend: Array.from({ length: 20 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (19 - i)); // Start from 19 days ago

          return {
            timestamp: date.toISOString(),
            personal_sentiment_score: (40 + Math.random() * 40).toFixed(2) // Random score between 40-80
          };
        })
      };
      return mockTrendData;

    case 'risk':
      // Generate mock data that matches the backend risk calculation
      // Get the mock trend data to calculate risk based on it
      const trendData = generateMockData('trend').sentiment_trend;

      // Extract personal sentiment scores - use all 20 entries
      const personalSentimentScores = trendData.map(item => parseFloat(item.personal_sentiment_score));

      // Calculate average sentiment score (use actual values from the chart)
      const avgSentimentScore = personalSentimentScores.reduce((sum, score) => sum + score, 0) / personalSentimentScores.length;

      // Calculate sentiment volatility (standard deviation)
      const mean = avgSentimentScore;
      const squaredDiffs = personalSentimentScores.map(score => Math.pow(score - mean, 2));
      const avgSquaredDiff = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / squaredDiffs.length;
      const sentimentVolatility = Math.sqrt(avgSquaredDiff);

      // Calculate recent change: Difference between the most recent and oldest score
      // Note: The array is in reverse chronological order (newest first)
      const recentChange = personalSentimentScores[0] - personalSentimentScores[personalSentimentScores.length - 1];

      // Determine risk level using the same logic as the backend
      let riskLevel;
      if (sentimentVolatility > 15 && recentChange < -10) {
        riskLevel = "Very High Risk";
      } else if (sentimentVolatility > 10 && recentChange < -5) {
        riskLevel = "High Risk";
      } else if (avgSentimentScore < 40) {
        riskLevel = "Moderate Risk";
      } else {
        riskLevel = "Low Risk";
      }

      console.log("Mock risk calculation:", {
        scores: personalSentimentScores,
        avgSentimentScore,
        sentimentVolatility,
        recentChange,
        riskLevel
      });

      // Generate some realistic values for development mode
      // These values will make more sense than zeros
      return {
        average_sentiment_score: avgSentimentScore || 35.7,
        sentiment_volatility: sentimentVolatility || 12.3,
        recent_change: recentChange || -8.5,
        risk_level: riskLevel || "Moderate Risk"
      };

    default:
      return {};
  }
};
