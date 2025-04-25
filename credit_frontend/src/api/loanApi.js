import axios from "axios"; // ✅ Ensure axios is imported

const API_URL = "http://127.0.0.1:8000/api/loans/accounts/";

export const fetchLoanAccounts = async () => {
  try {
    const token = localStorage.getItem("token"); // Retrieve token

    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`, // Attach token for authentication
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching loan accounts:", error);
    return [];
  }
};
