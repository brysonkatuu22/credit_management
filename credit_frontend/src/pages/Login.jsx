// File: src/pages/Login.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../services/authService";
import axios from "axios";
import { API_BASE_URL } from "../services/axiosConfig";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiLoader } from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animateForm, setAnimateForm] = useState(false);
  const navigate = useNavigate();

  // Add animation effect when component mounts and check for remembered email
  useEffect(() => {
    setAnimateForm(true);

    // Check if there's a remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    console.log("Attempting login with:", { email, password: "******" });

    // Clear any existing user data before login
    localStorage.clear();

    try {
      // If remember me is checked, store it in localStorage
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      const success = await login(email, password);

      if (success) {
        console.log("Login Success - Token stored");

        // Check if user is admin and redirect accordingly
        const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
        if (userInfo.is_admin) {
          console.log("Admin user detected, redirecting to admin dashboard");
          navigate("/admin-dashboard");
        } else {
          navigate("/dashboard");
        }
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

        // Provide user-friendly error messages
        if (err.response.status === 401) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(`Server error: ${err.response.status} - ${err.response.data.detail || JSON.stringify(err.response.data)}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error("Error request:", err.request);
        setError("Network error. No response from server. Please check your connection and make sure the backend server is running.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-fintrack-dark via-fintrack-DEFAULT to-fintrack-light">
      {/* Left side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div
          className={`bg-white p-6 md:p-8 shadow-card hover:shadow-card-hover rounded-xl w-full max-w-md transition-all duration-300 transform ${
            animateForm ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-1">Welcome Back</h2>
            <p className="text-gray-500 text-sm">Sign in to access your Fintrack account</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start animate-fadeIn">
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="email">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-fintrack-light focus:border-transparent transition-colors"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <label className="block text-gray-700 text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <a href="#" className="text-sm text-fintrack-light hover:text-fintrack-DEFAULT transition-colors">
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-fintrack-light focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-fintrack-DEFAULT focus:ring-fintrack-light border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-fintrack-DEFAULT to-fintrack-light text-white py-3 rounded-lg hover:from-fintrack-light hover:to-fintrack-DEFAULT transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fintrack-light"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <FiLoader className="animate-spin mr-2" />
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="font-medium text-fintrack-DEFAULT hover:text-fintrack-light transition-colors">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Branding & Features */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center text-white p-8 bg-gradient-to-br from-fintrack-DEFAULT to-fintrack-dark">
        <div className="mb-8 flex items-center animate-fadeIn">
          <div className="rounded-full border-2 border-white p-2 mr-3 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Fintrack Solution</h1>
        </div>

        <div className="text-center mb-12 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-4xl font-bold mb-2 tracking-tight">DIGITALIZING CREDIT LOAN</h2>
          <h2 className="text-4xl font-bold tracking-tight">MANAGEMENT</h2>
          <p className="mt-4 text-blue-100 max-w-md mx-auto">
            The smart way to track, manage, and optimize your credit and loans in one secure platform.
          </p>
        </div>

        <div className="flex justify-center w-full gap-6 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          {/* Feature boxes */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center text-white w-1/3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
            <div className="bg-fintrack-light rounded-full p-3 mb-4 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-lg mb-1">TRACK</span>
            <p className="text-xs text-center text-blue-100">Monitor all your loans in real-time</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center text-white w-1/3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
            <div className="bg-fintrack-light rounded-full p-3 mb-4 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="font-bold text-lg mb-1">MANAGE</span>
            <p className="text-xs text-center text-blue-100">Optimize your credit strategy</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 flex flex-col items-center justify-center text-white w-1/3 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg">
            <div className="bg-fintrack-light rounded-full p-3 mb-4 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg mb-1">ASSIST</span>
            <p className="text-xs text-center text-blue-100">AI-powered recommendations</p>
          </div>
        </div>

        <div className="mt-12 text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <p className="text-sm text-blue-100">© 2023 Fintrack Solution. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;