// File: src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/auth/login/",
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );

      console.log("Login Success:", response.data);
      localStorage.setItem("token", response.data.access);
      navigate("/dashboard");
    } catch (err) {
      if (err.response) {
        setError(err.response.data.detail || "Invalid credentials. Please try again.");
      } else {
        setError("Network error. Please check your connection.");
      }
    }
  };

  return (
    <div className="flex h-screen w-screen">
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
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg mt-6 hover:bg-blue-700 transition font-semibold text-lg"
            >
              Login
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
