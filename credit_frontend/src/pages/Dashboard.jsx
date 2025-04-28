// File: src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import ReportPrompt from "../components/ReportPrompt";

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [showReportPrompt, setShowReportPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    // Check if this is a fresh login (using session storage)
    const hasPromptBeenShown = sessionStorage.getItem("reportPromptShown");
    if (!hasPromptBeenShown && !hasShownPrompt) {
      // Wait a moment after login before showing the prompt
      const timer = setTimeout(() => {
        setShowReportPrompt(true);
        setHasShownPrompt(true);
        sessionStorage.setItem("reportPromptShown", "true");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [token, navigate, hasShownPrompt]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("reportPromptShown");
    navigate("/");
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* 🔹 Top Navigation Bar */}
      <nav className="bg-gradient-to-b from-blue-600 to-blue-800 shadow-lg p-4 flex justify-between items-center rounded-b-lg border-b-4 border-blue-900">
        <h1
          className="text-xl font-bold text-white drop-shadow-lg cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          Credit Portal
        </h1>
        <div className="space-x-6">
          <Link to="/loan-accounts" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Loan Accounts</Link>
          <Link to="/credit-report" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Credit Report</Link>
          <Link to="/learn-more" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Learn More</Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition drop-shadow-lg">
            Logout
          </button>
        </div>
      </nav>

      {/* 🔹 Simplified Body with White Background */}
      <div className="flex flex-1 justify-center items-center bg-white">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Dashboard</h2>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h3>
            <div className="flex justify-center space-x-6">
              <button
                onClick={() => setShowReportPrompt(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Credit Report
              </button>
              <Link
                to="/loan-accounts"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-md transition duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                View Loan Accounts
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Report Generation Prompt */}
      {showReportPrompt && (
        <ReportPrompt onClose={() => setShowReportPrompt(false)} />
      )}
    </div>
  );
};

export default Dashboard;