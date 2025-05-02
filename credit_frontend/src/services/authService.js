import axios from 'axios';
import { API_BASE_URL } from './axiosConfig';
import { updateUserData, clearAllData } from './dataService';

// Get the authentication token from local storage
export const getToken = () => {
  return localStorage.getItem('token');
};

// Set the authentication token in local storage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Remove the authentication token from local storage
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Check if the user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Login user
export const login = async (email, password) => {
  try {
    console.log('Attempting login with:', { email, password: '******' });
    // The correct endpoint is /api/auth/login/ (not /api/auth/auth/login/)
    const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
      email,
      password
    });

    console.log('Login response:', response.data);
    if (response.data && response.data.access) {
      setToken(response.data.access);

      // Store user info in localStorage and update data service
      if (response.data.user) {
        const userInfo = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: `${response.data.user.first_name} ${response.data.user.last_name}`.trim(),
          first_name: response.data.user.first_name,
          last_name: response.data.user.last_name
        };
        updateUserData(userInfo);
      } else {
        // If user info is not provided, fetch it
        try {
          const userResponse = await axios.get(`${API_BASE_URL}/auth/user/`, {
            headers: {
              'Authorization': `Bearer ${response.data.access}`
            }
          });

          if (userResponse.data) {
            const userInfo = {
              id: userResponse.data.id,
              email: userResponse.data.email,
              name: `${userResponse.data.first_name} ${userResponse.data.last_name}`.trim(),
              first_name: userResponse.data.first_name,
              last_name: userResponse.data.last_name
            };
            updateUserData(userInfo);
          }
        } catch (userError) {
          console.error('Error fetching user info:', userError);
          // Store at least the email
          updateUserData({ email });
        }
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Register user
export const register = async (userData) => {
  try {
    // The correct endpoint is /api/auth/register/ (not /api/auth/auth/register/)
    const response = await axios.post(`${API_BASE_URL}/auth/register/`, userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Logout user
export const logout = () => {
  removeToken();
  clearAllData(); // Clear all data from the data service

  // Ensure all localStorage items are cleared
  localStorage.clear(); // This will clear ALL localStorage items

  // Force page reload to ensure clean state
  window.location.href = '/';
};

export default {
  getToken,
  setToken,
  removeToken,
  isAuthenticated,
  login,
  register,
  logout
};
