import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import Dashboard from "../pages/Dashboard";
import SentimentAnalysis from "../pages/SentimentAnalysis";
import SentimentDashboard from './pages/SentimentDashboard';
import SentimentTrend from './pages/SentimentTrend';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sentiment-analysis" element={<SentimentAnalysis />} />
        <Route path="/sentiment-dashboard" element={<SentimentDashboard />} />
        <Route path="/sentiment-trend" element={<SentimentTrend />}/>
      </Routes>
    </Router>
  );
};

export default AppRouter;
