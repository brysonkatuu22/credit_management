// File: src/pages/CreditReport.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";

const CreditReport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAutomated, setIsAutomated] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const reportButtonRef = useRef(null);
  const downloadButtonRef = useRef(null);

  // Check if this is an automated navigation from the report prompt
  useEffect(() => {
    const automationActive = sessionStorage.getItem("reportAutomationActive");
    if (automationActive === "true") {
      setIsAutomated(true);

      // Simulate clicking the generate report button after a delay
      const timer = setTimeout(() => {
        if (reportButtonRef.current) {
          reportButtonRef.current.scrollIntoView({ behavior: "smooth" });

          // After scrolling, wait a moment and then click the button
          setTimeout(() => {
            if (reportButtonRef.current) {
              reportButtonRef.current.click();
            }
          }, 1500);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }

    // Check dark mode
    setDarkMode(localStorage.getItem('darkMode') === 'true');
  }, []);

  const handleRequestReport = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      console.error("No access token found.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/credit-report/report/request/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message);
      setReportUrl(response.data.report_url);

      // If this is an automated flow, automatically download the report
      if (isAutomated && response.data.report_url) {
        // Wait a moment before triggering the download
        setTimeout(() => {
          if (downloadButtonRef.current) {
            downloadButtonRef.current.scrollIntoView({ behavior: "smooth" });

            // After scrolling, wait a moment and then click the download button
            setTimeout(() => {
              if (downloadButtonRef.current) {
                downloadButtonRef.current.click();

                // Clear the automation flag after completion
                sessionStorage.removeItem("reportAutomationActive");

                // Navigate back to dashboard after a delay
                setTimeout(() => {
                  navigate("/dashboard");
                }, 3000);
              }
            }, 1500);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setMessage("Failed to generate report.");

      if (isAutomated) {
        // Clear the automation flag if there was an error
        sessionStorage.removeItem("reportAutomationActive");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Report features
  const reportFeatures = [
    "Comprehensive loan account details",
    "Payment History",
    "Credit utilization analysis",
    "Account status summary"
  ];

  return (
    <div className={`min-h-screen relative ${darkMode ? 'dark-mode' : ''}`}>
      {/* Background with pattern */}
      <div className="absolute inset-0 bg-blue-50 opacity-70">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 25px 25px, rgba(18, 0, 213, 0.1) 2%, transparent 0%),
            radial-gradient(circle at 75px 75px, rgba(16, 123, 245, 0.1) 2%, transparent 0%)
          `,
          backgroundSize: '100px 100px'
        }}></div>
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full bg-gradient-to-bl from-blue-100 to-transparent opacity-80"></div>
        <div className="absolute bottom-0 left-0 w-full md:w-1/2 h-1/2 bg-gradient-to-tr from-blue-200 to-transparent opacity-60"></div>
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-blue-400 opacity-10"></div>
      </div>

      {/* Content container */}
      <div className="relative min-h-screen flex flex-col">
        {/* Header with Navigation */}
        <Header />

        {/* Decorative elements */}
        <div className="absolute top-32 left-12 w-24 h-24 bg-blue-400 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute top-64 right-16 w-40 h-40 bg-blue-300 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-32 h-32 bg-blue-200 rounded-full opacity-30 blur-xl"></div>

        {/* Wave effect at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-48 overflow-hidden opacity-40">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C67.18,118.92,145.6,112.07,213.12,91.5Z" className="fill-blue-700"></path>
          </svg>
        </div>

        {/* Main content - Centered with flex */}
        <div className="flex-1 flex justify-center items-center p-6 z-10">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden backdrop-filter backdrop-blur-lg bg-opacity-95">
            {/* Top banner with icon */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 flex justify-center items-center">
              <div className="bg-white rounded-full p-4 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-4xl font-bold mb-4 text-blue-800 text-center">Get Your Loan Report Today</h2>
              <p className="text-gray-800 mb-8 text-center text-lg font-semibold">
                Request for your Loan Report to get a comprehensive view of your accounts as reported by Financial Institutions to the Bureau.
              </p>

              {/* Features section */}
              <div className="bg-blue-50 rounded-lg p-6 mb-8 shadow-inner">
                <h3 className="text-xl font-semibold text-blue-800 mb-4">Your report includes:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="bg-blue-600 rounded-full p-1 mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Report frequency info */}
              <div className="text-center mb-8 text-sm text-gray-500">
                <p>You can request one free report every 30 days.</p>
              </div>

              <div className="flex justify-center mb-8">
                <button
                  ref={reportButtonRef}
                  onClick={handleRequestReport}
                  disabled={isLoading}
                  className={`bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-lg transition duration-300 text-lg font-medium shadow-md flex items-center ${
                    isLoading ? "opacity-75 cursor-not-allowed" : "hover:shadow-lg transform hover:-translate-y-1"
                  } ${isAutomated ? "ring-4 ring-blue-300 ring-opacity-50 animate-pulse" : ""}`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating Report...
                    </>
                  ) : (
                    "Request Credit Report"
                  )}
                </button>
              </div>

              {message && (
                <div className="mt-6 text-green-600 font-medium text-center text-lg bg-green-50 p-4 rounded-lg border border-green-100 animate-fadeIn shadow-inner">
                  ✅ {message}
                </div>
              )}

              {reportUrl && (
                <div className="mt-6 text-center bg-blue-50 p-6 rounded-lg border border-blue-100 animate-fadeIn shadow-inner">
                  <h4 className="text-blue-800 font-semibold mb-2">Your report is ready!</h4>
                  <a
                    ref={downloadButtonRef}
                    href={`http://127.0.0.1:8000${reportUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center justify-center space-x-2 font-medium text-white bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition duration-200 shadow-md group ${
                      isAutomated ? "ring-4 ring-blue-300 ring-opacity-50 animate-pulse" : ""
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                    </svg>
                    <span>Download your credit report</span>
                  </a>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t border-gray-200">
              <p>Your data is encrypted and secure. We never share your information with third parties.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditReport;