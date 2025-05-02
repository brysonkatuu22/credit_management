// File: src/pages/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, loginUser } from "../api"; // Import API functions
import { FiEye, FiEyeOff, FiAlertCircle, FiCheckCircle, FiLoader, FiMail, FiLock, FiUser } from "react-icons/fi";

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
  const [animateForm, setAnimateForm] = useState(false);

  // Add animation effect when component mounts
  useEffect(() => {
    setAnimateForm(true);
  }, []);

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
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-fintrack-dark via-fintrack-DEFAULT to-fintrack-light">
      {/* Left side - Register Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 order-2 md:order-1">
        <div
          className={`bg-white p-6 md:p-8 shadow-card hover:shadow-card-hover rounded-xl w-full max-w-md transition-all duration-300 transform ${
            animateForm ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Create Your Account</h2>
            <p className="text-gray-500 text-sm">Join Fintrack to manage your credit loans</p>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start animate-fadeIn">
              <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-start animate-fadeIn">
              <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}

          {/* Registration Form */}
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {/* Name Fields - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="firstName">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-fintrack-light focus:border-transparent transition-colors ${
                      !validations.firstName.valid ? "border-red-500 focus:ring-red-400" : ""
                    }`}
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                {!validations.firstName.valid && (
                  <p className="text-red-500 text-xs mt-1">{validations.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="lastName">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-fintrack-light focus:border-transparent transition-colors ${
                      !validations.lastName.valid ? "border-red-500 focus:ring-red-400" : ""
                    }`}
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
                {!validations.lastName.valid && (
                  <p className="text-red-500 text-xs mt-1">{validations.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Email */}
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
                  name="email"
                  type="email"
                  className={`w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-fintrack-light focus:border-transparent transition-colors ${
                    !validations.email.valid ? "border-red-500 focus:ring-red-400" : ""
                  }`}
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {!validations.email.valid && (
                <p className="text-red-500 text-xs mt-1">{validations.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-fintrack-light focus:border-transparent transition-colors ${
                    !validations.password.valid ? "border-red-500 focus:ring-red-400" : ""
                  }`}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
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

              {/* Password Strength Indicators */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className={`flex items-center p-2 rounded-md ${passwordStrength.minLength ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.minLength ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs">8+ characters</span>
                </div>
                <div className={`flex items-center p-2 rounded-md ${passwordStrength.hasUpperCase ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasUpperCase ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs">Uppercase</span>
                </div>
                <div className={`flex items-center p-2 rounded-md ${passwordStrength.hasLowerCase ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasLowerCase ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs">Lowercase</span>
                </div>
                <div className={`flex items-center p-2 rounded-md ${passwordStrength.hasDigit ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasDigit ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs">Number</span>
                </div>
                <div className={`flex items-center p-2 rounded-md col-span-2 ${passwordStrength.hasSpecialChar ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${passwordStrength.hasSpecialChar ? "bg-green-500" : "bg-gray-300"}`}></div>
                  <span className="text-xs">Special character (!@#$%^&*)</span>
                </div>
              </div>

              {!validations.password.valid && (
                <p className="text-red-500 text-xs mt-1">{validations.password.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1.5" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  className={`w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-fintrack-light focus:border-transparent transition-colors ${
                    !validations.confirmPassword.valid ? "border-red-500 focus:ring-red-400" : ""
                  }`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              {!validations.confirmPassword.valid && (
                <p className="text-red-500 text-xs mt-1">{validations.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-fintrack-DEFAULT to-fintrack-light text-white py-3 rounded-lg hover:from-fintrack-light hover:to-fintrack-DEFAULT transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fintrack-light mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <FiLoader className="animate-spin mr-2" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/" className="font-medium text-fintrack-DEFAULT hover:text-fintrack-light transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Branding & Features */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center text-white p-8 order-1 md:order-2 bg-gradient-to-br from-fintrack-DEFAULT to-fintrack-dark">
        <div className="mb-8 flex items-center animate-fadeIn">
          <div className="rounded-full border-2 border-white p-2 mr-3 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold">Fintrack Solution</h1>
        </div>

        <div className="text-center mb-8 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">DIGITALIZING CREDIT LOAN</h2>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">MANAGEMENT</h2>
          <p className="mt-4 text-blue-100 max-w-md mx-auto">
            Join thousands of users who trust Fintrack to manage their credit loans efficiently.
          </p>
        </div>

        {/* Benefits Section */}
        <div className="w-full max-w-md mb-8 animate-fadeIn" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-xl font-semibold mb-4 text-center">Why Choose Fintrack?</h3>

          <div className="space-y-3">
            <div className="flex items-start bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <div className="bg-fintrack-light rounded-full p-1 mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm">Secure & Private</h4>
                <p className="text-xs text-blue-100">Your financial data is encrypted and protected</p>
              </div>
            </div>

            <div className="flex items-start bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <div className="bg-fintrack-light rounded-full p-1 mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm">Smart Analytics</h4>
                <p className="text-xs text-blue-100">Get insights and recommendations for your loans</p>
              </div>
            </div>

            <div className="flex items-start bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <div className="bg-fintrack-light rounded-full p-1 mr-3 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-sm">Save Time</h4>
                <p className="text-xs text-blue-100">Automated tracking and payment reminders</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center animate-fadeIn" style={{ animationDelay: '0.6s' }}>
          <p className="text-sm text-blue-100 mb-2">Already trusted by over 10,000+ users</p>
          <div className="flex justify-center space-x-2">
            <span className="inline-block h-2 w-2 rounded-full bg-fintrack-accent animate-pulse"></span>
            <span className="inline-block h-2 w-2 rounded-full bg-fintrack-accent animate-pulse" style={{ animationDelay: '0.2s' }}></span>
            <span className="inline-block h-2 w-2 rounded-full bg-fintrack-accent animate-pulse" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;