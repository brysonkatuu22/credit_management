import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ReportPrompt = ({ onClose }) => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportUrl, setReportUrl] = useState("");
  const [success, setSuccess] = useState(false);
  const [automationState, setAutomationState] = useState("idle"); // idle, navigating, scrolling, clicking, downloading, complete
  const [automationMessage, setAutomationMessage] = useState("");

  // Effect to handle the visual automation steps
  useEffect(() => {
    if (automationState === "navigating") {
      setAutomationMessage("Navigating to Credit Report page...");

      // Navigate to the credit report page
      const timer = setTimeout(() => {
        navigate("/credit-report");
        setAutomationState("scrolling");
      }, 1500);

      return () => clearTimeout(timer);
    }

    if (automationState === "scrolling") {
      setAutomationMessage("Scrolling to report section...");

      // Simulate scrolling
      const timer = setTimeout(() => {
        window.scrollTo({
          top: 300,
          behavior: "smooth"
        });
        setAutomationState("clicking");
      }, 1500);

      return () => clearTimeout(timer);
    }

    if (automationState === "clicking") {
      setAutomationMessage("Clicking generate report button...");

      // Simulate clicking the generate report button
      const timer = setTimeout(() => {
        // This will be handled by the CreditReport component
        // We'll just change the state to downloading
        setAutomationState("downloading");
      }, 1500);

      return () => clearTimeout(timer);
    }

    if (automationState === "downloading") {
      setAutomationMessage("Downloading your report...");

      // Simulate downloading
      const timer = setTimeout(() => {
        setAutomationState("complete");
        setSuccess(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [automationState, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      // Verify user password
      await axios.post(
        "http://127.0.0.1:8000/api/auth/verify-password/",
        { password },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Password verified, start the visual automation
      setIsVerifying(false);
      setIsGenerating(true);

      // Set the automation flag in sessionStorage
      sessionStorage.setItem("reportAutomationActive", "true");

      // Start the automation sequence
      setAutomationState("navigating");

      // In the background, still generate the report
      const response = await axios.post(
        "http://127.0.0.1:8000/api/credit-report/report/request/",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReportUrl(response.data.report_url);

    } catch (error) {
      setIsVerifying(false);
      setIsGenerating(false);
      setAutomationState("idle");

      // Clear the automation flag if there was an error
      sessionStorage.removeItem("reportAutomationActive");

      if (error.response && error.response.status === 401) {
        setError("Incorrect password. Please try again.");
      } else {
        setError("An error occurred. Please try again later.");
        console.error("Error:", error);
      }
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slideUp">
      <div className={`bg-white rounded-lg shadow-xl ${success ? 'p-4 w-80' : 'p-4 w-80 sm:w-96'} border-l-4 border-blue-600`}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-blue-800">
            {success ? "Report Generated!" : "Generate Credit Report"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {automationState === "idle" && !success ? (
          <>
            <p className="mb-3 text-gray-600 text-xs">
              Would you like to generate your credit report now? This will automatically navigate to the report page and generate it for you.
            </p>

            <form onSubmit={handleVerify} className="text-sm">
              <div className="mb-3">
                <label className="block text-gray-700 text-xs font-medium mb-1">
                  Confirm your password:
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-1 px-2 text-gray-700 text-xs leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Enter your password"
                  required
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-medium py-1 px-3 rounded"
                >
                  Not Now
                </button>
                <button
                  type="submit"
                  disabled={isVerifying || isGenerating}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1 px-3 rounded flex items-center"
                >
                  {isVerifying ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    "Generate Report"
                  )}
                </button>
              </div>
            </form>
          </>
        ) : automationState !== "idle" && !success ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-3">
              <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-600 font-medium text-xs">{automationMessage}</span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: automationState === "navigating" ? "25%" :
                         automationState === "scrolling" ? "50%" :
                         automationState === "clicking" ? "75%" :
                         automationState === "downloading" ? "90%" : "0%"
                }}
              ></div>
            </div>

            <p className="text-gray-500 text-xs italic">
              Please wait while the automation completes...
            </p>
          </div>
        ) : (
          <div className="text-center">
            <div className="mb-2 flex justify-center">
              <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="mb-3 text-gray-600 text-xs">
              Your credit report has been generated successfully!
            </p>
            <div className="flex justify-center space-x-2">
              <a
                href={`http://127.0.0.1:8000${reportUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center space-x-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition duration-200 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>View Report</span>
              </a>
              <button
                onClick={onClose}
                className="text-xs font-medium text-gray-600 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPrompt;
