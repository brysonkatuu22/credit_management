import axios from "axios";
import { API_BASE_URL } from "../services/axiosConfig";

const API_URL = `${API_BASE_URL}/financial/loans/`;

export const fetchLoanAccounts = async () => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching loan accounts:", error);
    return [];
  }
};

export const createLoanAccount = async (loanData) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.post(API_URL, loanData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating loan account:", error);
    throw error;
  }
};

export const updateLoanAccount = async (loanId, loanData) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await axios.put(`${API_URL}${loanId}/`, loanData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating loan account:", error);
    throw error;
  }
};

export const deleteLoanAccount = async (loanId) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Authentication required");
    }

    await axios.delete(`${API_URL}${loanId}/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.error("Error deleting loan account:", error);
    throw error;
  }
};
