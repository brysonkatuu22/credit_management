import axios from 'axios';

// Base URL for API requests - allow for configuration via environment variables
// In Vite, environment variables are accessed via import.meta.env, not process.env
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
console.log('API Base URL:', API_BASE_URL);

// Server status tracking
let isServerAvailable = true;
let lastServerCheck = 0;
const SERVER_CHECK_INTERVAL = 30000; // 30 seconds

// Check if the server is available
export const checkServerAvailability = async () => {
  try {
    // TEMPORARY FIX: Always assume server is available to prevent blocking requests
    // This bypasses the health check completely
    return true;

    /* ORIGINAL CODE COMMENTED OUT FOR DEBUGGING
    // Only check if we haven't checked recently
    const now = Date.now();
    if (now - lastServerCheck < SERVER_CHECK_INTERVAL) {
      return isServerAvailable;
    }

    // Update the last check time
    lastServerCheck = now;

    console.log('Performing server health check...');

    // Make a request to the health check endpoint with more resilient settings
    const response = await axios.get(`${API_BASE_URL}/financial/health/`, {
      timeout: 8000, // Increased timeout for health check
      retries: 2,    // Add retries for health check
      headers: {     // Minimal headers to reduce overhead
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

    // Check if the response contains a status field
    if (response.data && response.data.status) {
      isServerAvailable = response.data.status === 'ok';

      // Log detailed health check information
      console.log(`Server health check: ${isServerAvailable ? 'Available ✓' : 'Unavailable ✗'}`);
      if (response.data.database) {
        console.log(`Database status: ${response.data.database === 'ok' ? 'Connected ✓' : 'Error ✗'}`);
      }
      if (response.data.response_time) {
        console.log(`Response time: ${response.data.response_time}`);
      }

      // If there's an error in the health check, log it
      if (response.data.status === 'error' && response.data.message) {
        console.warn(`Health check warning: ${response.data.message}`);
      }
    } else {
      // Fallback to checking HTTP status if response doesn't have expected format
      isServerAvailable = response.status === 200;
      console.log(`Server health check (HTTP status): ${isServerAvailable ? 'Available ✓' : 'Unavailable ✗'}`);
    }

    return isServerAvailable;
    */
  } catch (error) {
    console.error('Server health check failed:', error.message);

    // TEMPORARY FIX: Always return true even on errors
    // This prevents the health check from blocking requests
    console.warn('Ignoring health check failure and proceeding anyway');
    return true;

    /* ORIGINAL CODE COMMENTED OUT FOR DEBUGGING
    // Log more detailed error information
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused: The Django server is not running or not accessible');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Connection timeout: The server is taking too long to respond');
    } else if (error.response) {
      console.error(`Server responded with status ${error.response.status}`);
    }

    isServerAvailable = false;
    return false;
    */
  }
};

// Create an axios instance with default config
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout (increased from 10)
  headers: {
    'Content-Type': 'application/json',
  },
  // Enhanced retry logic
  retry: 5, // Retry 5 times (increased from 2)
  retryDelay: 2000 // 2 second delay (increased from 1)
});

// Request interceptor to add auth token to requests
axiosInstance.interceptors.request.use(
  async (config) => {
    // Skip server check for health endpoint to avoid infinite loop
    if (!config.url.includes('health')) {
      try {
        // Check if server is available before making request
        // But don't block the request if the check itself fails
        const serverAvailable = await checkServerAvailability().catch(e => {
          console.warn('Server availability check failed, proceeding with request anyway:', e.message);
          return true; // Assume server is available if check fails
        });

        // TEMPORARILY DISABLED SERVER AVAILABILITY CHECK
        // Instead of blocking requests, we'll just log warnings and let all requests proceed
        if (!serverAvailable) {
          console.warn('Server appears unavailable but proceeding with request anyway:', config.url);
          // Log this for debugging but don't throw an error
        }
      } catch (checkError) {
        // TEMPORARILY DISABLED ERROR THROWING
        // Log all errors but don't block any requests
        console.error('Error during server availability check:', checkError.message);
        // Continue with the request anyway regardless of the error
      }
    }

    // Add auth token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Initialize retry properties if not already set
    if (axiosInstance.defaults.retry && !config.retry) {
      config.retry = axiosInstance.defaults.retry;
      config._retryCount = 0;
    }

    // Only log important requests to reduce console noise
    const importantEndpoints = ['calculate-credit-score', 'profile', 'loans', 'auth'];
    if (importantEndpoints.some(endpoint => config.url.includes(endpoint))) {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('Request setup error:', error.message);

    // Add technical details to the error
    error.technicalDetails = {
      message: error.message,
      code: error.code,
      stack: error.stack,
      phase: 'request_setup'
    };

    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and implement retry logic
axiosInstance.interceptors.response.use(
  (response) => {
    // Mark server as available on successful response
    isServerAvailable = true;
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    // Categorize the error
    const isNetworkError = error.message.includes('Network Error') || !error.response;
    const isServerError = error.response && error.response.status >= 500;
    const isAuthError = error.response && error.response.status === 401;
    const isNotFoundError = error.response && error.response.status === 404;

    // Update server availability status for network and server errors
    if (isNetworkError || isServerError) {
      isServerAvailable = false;
    }

    // Log important errors
    const importantEndpoints = ['calculate-credit-score', 'profile', 'loans', 'auth'];
    if (originalRequest.url && importantEndpoints.some(endpoint => originalRequest.url.includes(endpoint))) {
      console.error('API Error:', {
        url: originalRequest.url,
        status: error.response ? error.response.status : 'No response',
        message: error.message,
        type: isNetworkError ? 'Network Error' :
              isServerError ? 'Server Error' :
              isAuthError ? 'Authentication Error' :
              isNotFoundError ? 'Not Found' : 'Other Error'
      });
    }

    // Handle unauthorized access (e.g., redirect to login)
    if (isAuthError) {
      console.log('Authentication error detected, redirecting to login');
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Enhanced retry logic - retry network errors and server errors
    if (
      (isNetworkError || isServerError) &&
      originalRequest.url &&
      originalRequest.retry &&
      (!originalRequest._retryCount || originalRequest._retryCount < originalRequest.retry)
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      console.log(`Retrying request (${originalRequest._retryCount}/${originalRequest.retry}): ${originalRequest.url}`);

      // Exponential backoff: wait longer for each retry
      const delay = originalRequest.retryDelay * Math.pow(2, originalRequest._retryCount - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      // TEMPORARILY DISABLED SERVER AVAILABILITY CHECK BEFORE RETRY
      // Always proceed with retry regardless of server availability
      console.log('Proceeding with retry attempt regardless of server availability');

      return axiosInstance(originalRequest);
    }

    // Enhance error messages for better user feedback, but preserve original error details
    if (isNetworkError) {
      error.userMessage = 'Network error. Please check your connection and try again.';
    } else if (isServerError) {
      // Include the specific server error code and message if available
      const serverErrorMsg = error.response?.data?.error || error.response?.data?.detail || error.message;
      error.userMessage = `Server error (${error.response?.status}): ${serverErrorMsg}`;
    } else if (isNotFoundError) {
      const notFoundMsg = error.response?.data?.error || error.response?.data?.detail || 'The requested resource was not found.';
      error.userMessage = `Not Found (404): ${notFoundMsg}`;
    } else if (error.response && error.response.data) {
      // Extract as much detail as possible from the response
      if (error.response.data.error) {
        error.userMessage = error.response.data.error;
      } else if (error.response.data.detail) {
        error.userMessage = error.response.data.detail;
      } else if (typeof error.response.data === 'string') {
        error.userMessage = error.response.data;
      } else if (typeof error.response.data === 'object') {
        // Try to format object errors in a readable way
        const errorDetails = Object.entries(error.response.data)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('; ');
        error.userMessage = `Error details: ${errorDetails}`;
      } else {
        error.userMessage = `Error (${error.response.status}): ${error.message}`;
      }
    } else {
      error.userMessage = `Error: ${error.message || 'An unexpected error occurred'}`;
    }

    // Always include the technical details for debugging
    error.technicalDetails = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      data: error.response?.data,
      stack: error.stack
    };

    return Promise.reject(error);
  }
);

export default axiosInstance;
