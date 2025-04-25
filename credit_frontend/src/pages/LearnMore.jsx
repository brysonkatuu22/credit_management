import { useNavigate } from "react-router-dom";

const LearnMore = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navigation Bar with Red Logout Button */}
      <nav className="bg-gradient-to-b from-blue-600 to-blue-800 shadow-lg p-4 flex justify-between items-center rounded-b-lg border-b-4 border-blue-900">
        <h1 
          className="text-xl font-bold text-white drop-shadow-lg cursor-pointer" 
          onClick={() => navigate("/dashboard")}
        >
          Credit Portal
        </h1>
        <div className="space-x-4 flex items-center">
          <button
            className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200"
            onClick={() => navigate("/loan-accounts")}
          >
            Loan Accounts
          </button>
          <button
            className="text-blue-900 bg-white px-3 py-2 rounded-md shadow-md hover:bg-gray-200"
            onClick={() => navigate("/credit-report")}
          >
            Credit Report
          </button>
          <button className="text-white border-b-2 border-white px-3 py-2">
            Learn More
          </button>
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md shadow-md"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Learn More Content */}
      <div className="flex flex-1 justify-center items-center">
        <h2 className="text-3xl font-bold text-gray-700">Financial Tips & Sentiment Analysis</h2>
      </div>
    </div>
  );
};

export default LearnMore;
