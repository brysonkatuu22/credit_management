// File: src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import axios from "axios";
import { API_BASE_URL } from "../services/axiosConfig";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    console.log("Attempting login with:", { email, password: "******" });

    // Clear any existing user data before login
    localStorage.clear();

    try {
      const success = await login(email, password);

      if (success) {
        console.log("Login Success - Token stored");
        navigate("/dashboard");
      } else {
        console.error("Login failed - No access token in response");
        setError("Login failed. Invalid response from server.");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        console.error("Error response headers:", err.response.headers);
        setError(`Server error: ${err.response.status} - ${err.response.data.detail || JSON.stringify(err.response.data)}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error("Error request:", err.request);
        setError("Network error. No response from server. Please check your connection and make sure the backend server is running.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", err.message);
        setError(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900">
      {/* Left side - Login Form */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
          <h2 className="text-3xl font-bold text-center text-gray-800">Sign In</h2>
          <p className="text-gray-500 text-center text-sm mt-1">Access your account</p>

          {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

          <form className="mt-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-600 text-sm">Email Address</label>
              <input
                type="email"
                className="w-full p-3 mt-1 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-gray-600 text-sm">Password</label>
              <input
                type="password"
                className="w-full p-3 mt-1 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg mt-6 hover:bg-blue-600 transition font-medium"
            >
              Login
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-6">
            Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-700">Sign up</Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding & Features */}
      <div className="w-1/2 flex flex-col items-center justify-center text-white p-8">
        <div className="mb-8 flex items-center">
          <div className="rounded-full border-2 border-white p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Fintrack Solution.</h1>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-2">DIGITALIZING CREDIT LOAN</h2>
          <h2 className="text-4xl font-bold">MANAGEMENT</h2>
        </div>

        <div className="flex justify-center w-full gap-6">
          {/* Feature boxes */}
          <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center text-blue-900 w-1/3">
            <div className="bg-blue-900 rounded-full p-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-lg">TRACK</span>
          </div>

          <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center text-blue-900 w-1/3">
            <div className="bg-blue-900 rounded-full p-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-lg">MANAGE</span>
          </div>

          <div className="bg-white rounded-lg p-8 flex flex-col items-center justify-center text-blue-900 w-1/3">
            <div className="bg-blue-900 rounded-full p-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-lg">ASSIST</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;