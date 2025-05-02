import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "../pages/Login"; // Use correct relative path
import Register from "../pages/Register"; // Ensure the file exists
import Dashboard from "../pages/Dashboard"; // Correct relative path
import LoanAccounts from "../pages/LoanAccounts"; // Ensure filename matches
import CreditReport from "../pages/CreditReport"; // Correct case-sensitive import
import LearnMore from "../pages/LearnMore"; // Ensure correct file name
import ModelDashboard from "../pages/ModelDashboard"; // Import the new Model Dashboard
import Settings from "../pages/Settings"; // Import the Settings page
import ErrorBoundary from "../components/ErrorBoundary"; // Import the ErrorBoundary component


const AppRouter = () => {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/loan-accounts" element={<LoanAccounts />} />
          <Route path="/credit-report" element={<CreditReport />} />
          <Route path="/learn-more" element={<LearnMore />} />
          <Route path="/model-dashboard" element={<ModelDashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
};

export default AppRouter;