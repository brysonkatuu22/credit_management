import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between text-white shadow">
      <h1 className="text-xl font-bold">Credit Portal</h1>
      <div className="flex gap-4">
        <Link to="/dashboard" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
          Dashboard
        </Link>
        <Link to="/loan-accounts" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
          Loan Accounts
        </Link>
        <Link to="/credit-report" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
          Credit Report
        </Link>
        <Link to="/sentiment-dashboard" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
          Sentiment Dashboard
        </Link>
        <Link to="/learn-more" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
          Learn More
        </Link>
        <Link to="/sentiment-analysis" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100">
          Sentiment Analysis
        </Link>
        <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
