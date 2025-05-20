// File: src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, Toaster } from 'react-hot-toast';

// API URLs to try
const API_URLS = [
  "http://127.0.0.1:8000",
  "http://localhost:8000"
];

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Try each API URL until one works
    let success = false;
    let lastError = null;

    for (const baseUrl of API_URLS) {
      try {
        const url = `${baseUrl}/api/auth/login/`;
        console.log(`Trying to login at: ${url}`);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Login failed with status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Login Success:", data);

        // Store the token and expiration time
        localStorage.setItem("token", data.access);

        // Calculate token expiration time (default to 1 hour if not provided)
        const expiresIn = data.expires_in || 3600; // seconds
        const expirationTime = new Date().getTime() + expiresIn * 1000;
        localStorage.setItem("tokenExpiration", expirationTime.toString());

        success = true;
        navigate("/dashboard");
        break;
      } catch (err) {
        console.error(`Error logging in at ${baseUrl}:`, err);
        lastError = err;
      }
    }

    if (!success) {
      const errorMessage = lastError?.message || "Network error. Please check your connection.";
      setError(errorMessage);
      toast.error(errorMessage);
    }

    setIsLoading(false);
  };

  return (
    <div className="flex h-screen w-screen">
      <Toaster position="top-center" />

      {/* Left Side */}
      <div className="w-1/2 flex flex-col justify-center items-center bg-blue-900 text-white px-16">
        <h1 className="text-4xl font-bold">Welcome to Fintrack✔️</h1>
        <p className="text-lg mt-3 text-center">Digitalizing Credit Loan Management.</p>
      </div>

      {/* Right Side */}
      <div className="w-1/2 flex justify-center items-center bg-gray-100">
        <div className="bg-white p-10 shadow-lg rounded-lg w-full max-w-sm">
          <h2 className="text-3xl font-semibold text-center">Sign In</h2>
          <p className="text-gray-500 text-center text-sm mt-1">Access your account</p>

          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}

          <form className="mt-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-600 text-sm font-medium">Email Address</label>
              <input
                type="email"
                className="w-full p-3 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-gray-600 text-sm font-medium">Password</label>
              <input
                type="password"
                className="w-full p-3 mt-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-100"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 transition font-semibold text-lg flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <p className="text-sm text-gray-600 text-center mt-4">
            Don't have an account? <Link to="/register" className="text-blue-600 font-medium">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
