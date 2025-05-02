// File: src/pages/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api"; // Import API functions
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiLoader } from "react-icons/fi";

const Register = () => {
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Validation state
  const [validations, setValidations] = useState({
    firstName: { valid: true, message: "" },
    lastName: { valid: true, message: "" },
    email: { valid: true, message: "" },
    password: { valid: true, message: "" },
    confirmPassword: { valid: true, message: "" }
  });

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasDigit: false,
    hasSpecialChar: false
  });

  // Update form data
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear errors when user types
    setError("");

    // Validate in real-time
    validateField(name, value);
  };

  // Validate individual field
  const validateField = (name, value) => {
    let isValid = true;
    let message = "";

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          isValid = false;
          message = "First name is required";
        }
        break;

      case "lastName":
        if (!value.trim()) {
          isValid = false;
          message = "Last name is required";
        }
        break;

      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value.trim()) {
          isValid = false;
          message = "Email is required";
        } else if (!emailRegex.test(value)) {
          isValid = false;
          message = "Please enter a valid email address";
        }
        break;

      case "password":
        // Check password strength
        const minLength = /.{8,}/.test(value);
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasDigit = /[0-9]/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        setPasswordStrength({
          minLength,
          hasUpperCase,
          hasLowerCase,
          hasDigit,
          hasSpecialChar
        });

        if (!value) {
          isValid = false;
          message = "Password is required";
        } else if (!minLength || !hasUpperCase || !hasLowerCase || !hasDigit || !hasSpecialChar) {
          isValid = false;
          message = "Password doesn't meet all requirements";
        }

        // Also validate confirm password if it exists
        if (formData.confirmPassword) {
          validateField("confirmPassword", formData.confirmPassword);
        }
        break;

      case "confirmPassword":
        if (!value) {
          isValid = false;
          message = "Please confirm your password";
        } else if (value !== formData.password) {
          isValid = false;
          message = "Passwords do not match";
        }
        break;

      default:
        break;
    }

    setValidations(prev => ({
      ...prev,
      [name]: { valid: isValid, message }
    }));

    return isValid;
  };

  // Validate all fields
  const validateForm = () => {
    let isValid = true;

    // Validate each field
    Object.keys(formData).forEach(field => {
      const fieldIsValid = validateField(field, formData[field]);
      if (!fieldIsValid) isValid = false;
    });

    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate all fields
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Register the user
      const result = await registerUser(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName
      );

      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      setSuccess(`Welcome, ${fullName}! Your account has been created successfully. Logging you in...`);

      // Clear any existing user data before registration
      localStorage.clear();

      // Auto-login after successful registration
      try {
        await loginUser(formData.email, formData.password);

        // Store user info in localStorage
        const userInfo = {
          email: formData.email,
          name: fullName,
          first_name: formData.firstName,
          last_name: formData.lastName
        };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));

        // Redirect to dashboard after successful login
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } catch (loginErr) {
        setSuccess(`Welcome, ${fullName}! Your account has been created successfully. Please log in.`);
        // Redirect to login page if auto-login fails
        setTimeout(() => {
          navigate("/");
        }, 1500);
      }
    } catch (err) {
      setError(err || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900">
      {/* Left side - Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 order-2 md:order-1">
        <div className="bg-white p-6 md:p-8 shadow-lg rounded-lg w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-gray-700 mb-4">Create Your Account</h2>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 flex items-start">
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 flex items-start">
              <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* Registration Form */}
          <form className="mt-4" onSubmit={handleSubmit} noValidate>
            {/* Name Fields - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* First Name */}
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className={`w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    !validations.firstName.valid ? "border-red-500" : ""
                  }`}
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
                {!validations.firstName.valid && (
                  <p className="text-red-500 text-xs mt-1">{validations.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className={`w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    !validations.lastName.valid ? "border-red-500" : ""
                  }`}
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
                {!validations.lastName.valid && (
                  <p className="text-red-500 text-xs mt-1">{validations.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  !validations.email.valid ? "border-red-500" : ""
                }`}
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {!validations.email.valid && (
                <p className="text-red-500 text-xs mt-1">{validations.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-4">
              <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    !validations.password.valid ? "border-red-500" : ""
                  }`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>

              {/* Password Strength Indicators */}
              <div className="mt-2 space-y-1">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.minLength ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs text-gray-600">At least 8 characters</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasUpperCase ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs text-gray-600">At least one uppercase letter</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasLowerCase ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs text-gray-600">At least one lowercase letter</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasDigit ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs text-gray-600">At least one number</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasSpecialChar ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs text-gray-600">At least one special character</span>
                </div>
              </div>

              {!validations.password.valid && (
                <p className="text-red-500 text-xs mt-1">{validations.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label className="block text-gray-600 text-sm font-medium mb-1" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full p-3 border rounded bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    !validations.confirmPassword.valid ? "border-red-500" : ""
                  }`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
              {!validations.confirmPassword.valid && (
                <p className="text-red-500 text-xs mt-1">{validations.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-sm text-gray-600 text-center mt-6">
            Already have an account? <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">Log in</Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding & Features */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-white p-8 order-1 md:order-2">
        <div className="mb-8 flex items-center">
          <div className="rounded-full border-2 border-white p-2 mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Fintrack Solution.</h1>
        </div>

        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-2">DIGITALIZING CREDIT LOAN</h2>
          <h2 className="text-3xl md:text-4xl font-bold">MANAGEMENT</h2>
        </div>

        <div className="flex flex-col md:flex-row justify-center w-full gap-4 md:gap-6">
          {/* Feature boxes */}
          <div className="bg-white rounded-lg p-6 md:p-8 flex flex-col items-center justify-center text-blue-900 w-full md:w-1/3">
            <div className="bg-blue-900 rounded-full p-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-lg">TRACK</span>
          </div>

          <div className="bg-white rounded-lg p-6 md:p-8 flex flex-col items-center justify-center text-blue-900 w-full md:w-1/3">
            <div className="bg-blue-900 rounded-full p-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="font-bold text-lg">MANAGE</span>
          </div>

          <div className="bg-white rounded-lg p-6 md:p-8 flex flex-col items-center justify-center text-blue-900 w-full md:w-1/3">
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