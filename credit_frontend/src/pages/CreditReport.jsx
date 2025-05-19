// File: src/pages/CreditReport.jsx
import { useNavigate, Link } from "react-router-dom";

const CreditReport = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-gradient-to-b from-blue-600 to-blue-800 shadow-lg p-4 flex justify-between items-center rounded-b-lg border-b-4 border-blue-900">
        <h1
          className="text-xl font-bold text-white drop-shadow-lg cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          Credit Portal
        </h1>
        <div className="space-x-6">
          <Link to="/loan-accounts" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Loan Accounts</Link>
          <Link to="/credit-report" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200 font-bold">Credit Report</Link>
          <Link to="/sentiment-dashboard" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Sentiment Dashboard</Link>
          <button
            className="bg-red-500 text-white px-3 py-2 rounded-md shadow-md hover:bg-red-600"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Credit Report Content */}
      <div className="flex flex-1 justify-center items-center">
        <h2 className="text-3xl font-bold text-gray-700">Generate Your Credit Report</h2>
      </div>
    </div>
  );
};

export default CreditReport;
