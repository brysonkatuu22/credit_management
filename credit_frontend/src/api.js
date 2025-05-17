// File: src/api.js
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/auth";

export const registerUser = async (email, password, firstName, lastName) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register/`, {
      email,
      password,
      first_name: firstName,
      last_name: lastName
    }, {
      headers: { "Content-Type": "application/json" }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      // Server responded with an error
      if (error.response.data.detail) {
        throw error.response.data.detail;
      } else if (error.response.data) {
        // Format validation errors
        const errorMessages = [];
        for (const field in error.response.data) {
          if (Array.isArray(error.response.data[field])) {
            errorMessages.push(`${field}: ${error.response.data[field].join(' ')}`);
          } else {
            errorMessages.push(`${field}: ${error.response.data[field]}`);
          }
        }
        throw errorMessages.join('. ');
      }
    }
    // Network error or other issues
    throw "Network error or server unavailable. Please try again later.";
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login/`, {
      email,
      password,
    }, {
      headers: { "Content-Type": "application/json" }
    });

    // Store tokens in localStorage
    localStorage.setItem('token', response.data.access);
    localStorage.setItem('refreshToken', response.data.refresh);

    // Store user info if available
    if (response.data.user) {
      const userInfo = {
        id: response.data.user.id,
        email: response.data.user.email,
        name: `${response.data.user.first_name} ${response.data.user.last_name}`.trim(),
        first_name: response.data.user.first_name,
        last_name: response.data.user.last_name
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
    } else {
      // If user info is not provided, fetch it
      try {
        const userResponse = await axios.get(`${API_BASE_URL}/user/`, {
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
          localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
      } catch (userError) {
        console.error('Error fetching user info:', userError);
        // Store at least the email
        localStorage.setItem('userInfo', JSON.stringify({ email }));
      }
    }

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data.detail : "Network error";
  }
};
