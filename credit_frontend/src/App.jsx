import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import LoanAccounts from "./pages/LoanAccounts";
import CreditReport from "./pages/CreditReport";
import Login from "./pages/Login";
import Register from "./pages/Register";
import FinancialSentimentForm from "./components/FinancialSentimentForm";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import SentimentDashboard from './pages/SentimentDashboard';
import SentimentTrend from './pages/SentimentTrend';
import DetailedResults from './pages/DetailedResults';
import SentimentResults from './pages/SentimentResults';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/loan-accounts" element={<LoanAccounts />} />
        <Route path="/credit-report" element={<CreditReport />} />
        <Route path="/sentiment-form" element={<FinancialSentimentForm />} />
        <Route path="/sentiment-analysis" element={<SentimentAnalysis />} />
        <Route path="/sentiment-dashboard" element={<SentimentDashboard />} />
        <Route path="/sentiment-trend" element={<SentimentTrend />} />
        <Route path="/detailed-results" element={<DetailedResults />} />
        <Route path="/sentiment-results" element={<SentimentResults />} />
      </Routes>
    </Router>
  );
}

export default App;
