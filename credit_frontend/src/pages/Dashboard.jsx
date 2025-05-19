// File: src/pages/Dashboard.jsx
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

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

  const data = [
    { month: "Jan", score: 720 },
    { month: "Feb", score: 730 },
    { month: "Mar", score: 710 },
    { month: "Apr", score: 740 },
    { month: "May", score: 750 },
    { month: "Jun", score: 755 },
    { month: "Jul", score: 760 },
    { month: "Aug", score: 770 },
    { month: "Sep", score: 765 },
    { month: "Oct", score: 780 },
    { month: "Nov", score: 790 },
    { month: "Dec", score: 800 },
  ];

  return (
    <div className="min-h-screen w-screen flex flex-col bg-gray-100">
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
          <Link to="/sentiment-dashboard" className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200">Sentiment Dashboard</Link>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-2 rounded-md shadow-md hover:bg-red-600">
            Logout
          </button>
        </div>
      </nav>

      {/* 🔹 Credit Score and Graph Section */}
      <div className="flex flex-col items-center justify-center gap-16 p-10">
        {/* Top Row: Credit Score and Graph */}
        <div className="flex flex-wrap justify-center items-center gap-16">
          {/* Credit Score Display */}
          <div className="bg-white shadow-lg p-20 rounded-full text-center w-96 h-96 flex flex-col justify-center items-center">
            <h2 className="text-3xl font-bold text-gray-700">Your Credit Score</h2>
            <p className="text-7xl font-extrabold text-blue-500 mt-4">750</p>
          </div>

          {/* Line Graph */}
          <div className="bg-white shadow-lg p-8 rounded-lg w-[600px] h-[400px] flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[700, 820]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#1E3A8A" strokeWidth={4} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 🔹 NEW: Sentiment Analysis Section
        <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-5xl text-center mt-8">
          <h2 className="text-2xl font-semibold text-gray-800">Financial Sentiment Checker</h2>
          <p className="text-gray-600 mt-2">Understand your financial mindset. Take a short test to reflect on how you're feeling about your finances.</p>
          <Link to="/sentiment-analysis">
            <button className="mt-6 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">
              Take Financial Sentiment Test
            </button>
          </Link>
        </div> */}
      </div>
    </div>
  );
};

export default Dashboard;
