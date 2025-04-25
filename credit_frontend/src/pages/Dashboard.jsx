// File: src/pages/Dashboard.jsx
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
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
        <h2 className="text-4xl font-bold text-gray-800">Dashboard</h2>
      </div>
    </div>
  );
};

export default Dashboard;