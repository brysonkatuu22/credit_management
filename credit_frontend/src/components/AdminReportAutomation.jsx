import { useState, useEffect, useRef } from "react";
import { Spinner, Alert, ProgressBar } from "react-bootstrap";
import axios from "axios";
import "./AdminReportAutomation.css";

/**
 * Component that handles the automated process of generating and downloading
 * credit reports for users as an admin with visual animations
 */
const AdminReportAutomation = ({
  userEmail,
  onComplete,
  onError,
  autoDownload = true
}) => {
  const [automationState, setAutomationState] = useState("idle");
  const [message, setMessage] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [progress, setProgress] = useState(0);
  const [animationStep, setAnimationStep] = useState(0);
  const [showCursor, setShowCursor] = useState(false);
  const cursorRef = useRef(null);
  const searchBoxRef = useRef(null);
  const userCardRef = useRef(null);
  const generateButtonRef = useRef(null);
  const downloadButtonRef = useRef(null);

  // Start the automation process when the component mounts
  useEffect(() => {
    if (userEmail && automationState === "idle") {
      startAutomation();
    }
  }, [userEmail]);

  // Handle different automation states
  useEffect(() => {
    if (automationState === "initializing") {
      // Show cursor and start visual animation
      setShowCursor(true);
      setProgress(10);
      setTimeout(() => setAutomationState("searching"), 1000);
    } else if (automationState === "searching") {
      setProgress(25);
      searchUser();
    } else if (automationState === "selecting") {
      setProgress(40);
      selectUser();
    } else if (automationState === "generating") {
      setProgress(60);
      generateReport();
    } else if (automationState === "downloading" && autoDownload) {
      setProgress(80);
      downloadReport();
    } else if (automationState === "completed") {
      setProgress(100);
      if (onComplete) {
        onComplete({
          reportUrl,
          user: selectedUser
        });
      }
    } else if (automationState === "error") {
      if (onError) {
        onError(error);
      }
    }
  }, [automationState]);

  // Animation for cursor movement
  useEffect(() => {
    if (!showCursor || !cursorRef.current) return;

    const animateCursor = () => {
      const cursor = cursorRef.current;
      if (!cursor) return;

      // Different positions based on the animation step
      let targetElement = null;
      let offsetX = 0;
      let offsetY = 0;

      switch (animationStep) {
        case 0: // Move to search box
          targetElement = searchBoxRef.current;
          offsetX = 100;
          offsetY = 20;
          break;
        case 1: // Move to user card
          targetElement = userCardRef.current;
          offsetX = 150;
          offsetY = 30;
          break;
        case 2: // Move to generate button
          targetElement = generateButtonRef.current;
          offsetX = 100;
          offsetY = 20;
          break;
        case 3: // Move to download button
          targetElement = downloadButtonRef.current;
          offsetX = 100;
          offsetY = 20;
          break;
        default:
          return;
      }

      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        cursor.style.left = `${rect.left + offsetX}px`;
        cursor.style.top = `${rect.top + offsetY}px`;

        // Add click animation after cursor reaches the target
        setTimeout(() => {
          cursor.classList.add('clicking');
          setTimeout(() => {
            cursor.classList.remove('clicking');
            setAnimationStep(prev => prev + 1);
          }, 300);
        }, 800);
      }
    };

    animateCursor();
  }, [animationStep, showCursor]);

  const startAutomation = () => {
    setMessage("Starting automation process...");
    setAnimationStep(0);
    setAutomationState("initializing");
  };

  const searchUser = async () => {
    setMessage(`Searching for user with email: ${userEmail}...`);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://127.0.0.1:8000/api/credit-report/admin/search-users/?email=${userEmail}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.length === 0) {
        setError(`No users found with email: ${userEmail}`);
        setAutomationState("error");
        return;
      }

      setSearchResults(response.data);

      // Simulate typing in the search box with the cursor
      setTimeout(() => {
        setAnimationStep(1); // Move cursor to user card
        setTimeout(() => {
          setAutomationState("selecting");
        }, 1500);
      }, 1000);
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err.response?.data?.error || `Failed to search for user: ${userEmail}`);
      setAutomationState("error");
    }
  };

  const selectUser = () => {
    setMessage("Selecting user from search results...");

    // Select the first user from the search results
    const user = searchResults[0];
    setSelectedUser(user);

    // Move cursor to generate button
    setTimeout(() => {
      setAnimationStep(2);
      setTimeout(() => {
        setAutomationState("generating");
      }, 1500);
    }, 1000);
  };

  const generateReport = async () => {
    setMessage(`Generating credit report for ${selectedUser.email}...`);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://127.0.0.1:8000/api/credit-report/admin/generate-report/',
        { user_email: selectedUser.email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setReportUrl(response.data.report_url);

      // Move cursor to download button
      setTimeout(() => {
        setAnimationStep(3);
        setTimeout(() => {
          setAutomationState("downloading");
        }, 1500);
      }, 1000);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.response?.data?.error || `Failed to generate report for: ${selectedUser.email}`);
      setAutomationState("error");
    }
  };

  const downloadReport = () => {
    setMessage("Downloading report...");

    // Create a link element and trigger the download
    if (reportUrl) {
      const link = document.createElement('a');
      link.href = `http://127.0.0.1:8000${reportUrl}`;
      link.target = '_blank';
      link.click();

      // Mark as completed after a short delay
      setTimeout(() => {
        setShowCursor(false); // Hide cursor when done
        setAutomationState("completed");
      }, 1500);
    } else {
      setError("No report URL available for download");
      setAutomationState("error");
    }
  };

  // Render the automation status with visual elements
  return (
    <div className="automation-status">
      {/* Progress bar */}
      <ProgressBar
        now={progress}
        variant={automationState === "error" ? "danger" : "primary"}
        className="mb-3 automation-progress"
        animated={automationState !== "completed" && automationState !== "error"}
      />

      {/* Status message */}
      {automationState !== "idle" && automationState !== "completed" && automationState !== "error" && (
        <div className="d-flex align-items-center mb-3">
          <Spinner animation="border" size="sm" className="me-2" />
          <span>{message}</span>
        </div>
      )}

      {/* Visual animation area */}
      <div className="animation-container mb-4">
        {showCursor && (
          <div ref={cursorRef} className="automation-cursor"></div>
        )}

        {/* Visual representation of the UI elements being automated */}
        <div className="automation-ui-simulation">
          <div ref={searchBoxRef} className="simulation-search-box">
            <div className="simulation-input">
              {userEmail}
            </div>
            <button className="simulation-button">Search</button>
          </div>

          {searchResults.length > 0 && (
            <div ref={userCardRef} className="simulation-user-card">
              <div className="simulation-user-info">
                <div className="simulation-user-email">{searchResults[0].email}</div>
                <div className="simulation-user-name">
                  {searchResults[0].first_name} {searchResults[0].last_name}
                </div>
              </div>
            </div>
          )}

          {selectedUser && (
            <>
              <div ref={generateButtonRef} className="simulation-generate-button">
                Generate Report
              </div>

              {reportUrl && (
                <div ref={downloadButtonRef} className="simulation-download-button">
                  Download Report
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Completion message */}
      {automationState === "completed" && (
        <Alert variant="success">
          <Alert.Heading>Automation Completed</Alert.Heading>
          <p>The report for {selectedUser?.email} has been successfully generated and downloaded.</p>
          {reportUrl && (
            <div className="mt-2">
              <a
                href={`http://127.0.0.1:8000${reportUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-success"
              >
                Download Again
              </a>
            </div>
          )}
        </Alert>
      )}

      {/* Error message */}
      {automationState === "error" && (
        <Alert variant="danger">
          <Alert.Heading>Automation Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
    </div>
  );
};

export default AdminReportAutomation;
