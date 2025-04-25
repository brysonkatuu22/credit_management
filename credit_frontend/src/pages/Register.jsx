// File: src/pages/Register.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api"; // Import API function

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validatePassword = (password) => {
    const minLength = /.{8,}/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;
    const digit = /[0-9]/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;
    if (!minLength.test(password)) return "Password must be at least 8 characters.";
    if (!upperCase.test(password)) return "Password must contain at least one uppercase letter.";
    if (!lowerCase.test(password)) return "Password must contain at least one lowercase letter.";
    if (!digit.test(password)) return "Password must contain at least one digit.";
    if (!specialChar.test(password)) return "Password must contain at least one special character.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    try {
      await registerUser(email, password);
      setSuccess("Registration successful! You can now log in.");
    } catch (err) {
      setError(err || "Registration failed. Try again.");
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900">
      {/* Left side - Register Form */}
      <div className="w-1/2 flex items-center justify-center p-8">
        <div className="bg-white p-8 shadow-lg rounded-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Register</h2>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm text-center mb-4">{success}</p>}
          <form className="mt-4" onSubmit={handleSubmit}>
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
            <div className="mt-4">
              <label className="block text-gray-600 text-sm">Confirm Password</label>
              <input
                type="password"
                className="w-full p-3 mt-1 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg mt-6 hover:bg-blue-600 transition font-medium"
            >
              Register
            </button>
          </form>
          <p className="text-sm text-gray-600 text-center mt-6">
            Already have an account? <Link to="/" className="text-blue-500 hover:text-blue-700">Login here</Link>
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

export default Register;