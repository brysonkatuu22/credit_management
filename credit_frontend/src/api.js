// File: src/api.js
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/auth";

export const registerUser = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register/`, {
      email,
      password,
    }, {
      headers: { "Content-Type": "application/json" }
    });

    return response.data;
  } catch (error) {
    throw error.response ? error.response.data.detail : "Network error";
  }
};
