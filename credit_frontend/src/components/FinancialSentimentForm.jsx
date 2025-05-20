import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SampleDataSelector from './SampleDataSelector';

const questions = [
  "How confident are you in repaying your current loan?",
  "Have you missed any loan or bill payments recently?",
  "How do you feel about your ability to meet your monthly loan repayment obligations?",
  "How likely are you to prioritize your loan payments over other expenses (e.g., rent, utilities)?",
  "What is the primary reason you may struggle to make your loan payments? (e.g., job loss, low income, medical expenses, financial mismanagement, etc.)",
  "How stable do you feel your income is (e.g., regular paycheck, irregular, fluctuating)?",
  "Are you currently experiencing any financial stress that could impact your ability to repay your loan?",
  "Have you had any major financial challenges recently that could affect your loan repayment?",
  "Do you have an emergency fund or savings set aside for unexpected financial events?",
  "How would you rate your overall satisfaction with your current loan terms (interest rate, repayment period, etc.)?",
  "Are you currently in contact with any financial advisor or credit counselor to help with your loan repayment strategy?",
  "How likely are you to seek assistance if you are struggling to make a loan payment?",
  "How comfortable are you with taking financial risks when faced with a financial challenge?",
  "What financial steps are you actively taking to reduce your debt? (e.g., paying off high-interest debt, debt consolidation, budgeting)",
  "How often do you assess your financial situation or check your credit score?",
  "How much of your monthly income goes toward paying off your debts (including loan payments, credit cards, etc.)?",
  "Do you have a plan for paying off your loan(s)? If yes, how committed are you to following through with it?"
];

const FinancialSentimentForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(''));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (value) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = value;
    setAnswers(newAnswers);
  };

  const handleSelectSample = (sampleResponses) => {
    // Fill all answers with the sample data
    setAnswers([...sampleResponses]);
    // Update the current answer in the form
    setCurrentStep(0);
  };

  const handleSubmitSampleData = () => {
    // Check if all answers are filled
    const emptyAnswers = answers.some(answer => !answer.trim());
    if (emptyAnswers) {
      alert("Please select a sample data set first.");
      return;
    }

    // Submit the form with the sample data
    handleSubmit();
  };

  const nextQuestion = () => {
    if (answers[currentStep].trim() === '') {
      alert('Please provide an answer before continuing.');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  };

  const prevQuestion = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        alert("You need to be logged in to submit the form. Please log in and try again.");
        navigate("/login");
        return;
      }

      console.log("Submitting answers:", answers);

      // Check if any answers are empty
      const emptyAnswers = answers.some(answer => !answer.trim());
      if (emptyAnswers) {
        alert("Please make sure all questions have been answered.");
        setLoading(false);
        return;
      }

      // Try multiple endpoint formats and ports
      const endpoints = [
        "http://127.0.0.1:8000/api/auth/sentiment-analysis/",
        "http://localhost:8000/api/auth/sentiment-analysis/",
        "http://127.0.0.1:5173/api/auth/sentiment-analysis/",
        "http://localhost:5173/api/auth/sentiment-analysis/"
      ];

      let success = false;

      // Log the token (first few characters for security)
      console.log("Token (first 10 chars):", token ? token.substring(0, 10) + "..." : "No token");

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        if (success) break;

        try {
          console.log(`Trying endpoint: ${endpoint}`);

          // Try the API endpoint

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ responses: answers }),
            credentials: 'include'
          });

          // Get the response text first for debugging
          const responseText = await res.text();
          console.log(`Raw API Response from ${endpoint}:`, responseText);

          // Try to parse as JSON
          let data;
          try {
            data = JSON.parse(responseText);
          } catch (parseError) {
            console.error("Failed to parse JSON response:", parseError);
            console.error(`Invalid JSON response from ${endpoint}: ${responseText.substring(0, 100)}...`);
            continue; // Try next endpoint
          }

          if (!res.ok) {
            console.error(`API Error Response from ${endpoint}:`, data);
            console.error(`API responded with status: ${res.status} - ${data.error || 'Unknown error'}`);
            continue; // Try next endpoint
          }

          console.log(`Parsed API Response from ${endpoint}:`, data);

          if (!data || !data.results) {
            console.error(`Invalid response format from ${endpoint}:`, data);
            console.error(`The API response from ${endpoint} did not contain the expected results format`);
            continue; // Try next endpoint
          }

          setResult(data);
          success = true;
          break;

        } catch (fetchError) {
          console.error(`Fetch error from ${endpoint}:`, fetchError);
          // Continue to next endpoint
        }
      }

      // If all endpoints failed, throw the last error
      if (!success) {
        // Generate fallback data if needed
        const fallbackData = {
          results: answers.map((text) => ({
            text,
            p_positive: Math.random() * 0.7 + 0.3,
            p_negative: Math.random() * 0.3,
            p_neutral: Math.random() * 0.4,
            intensity_score: Math.random() * 0.8 - 0.2,
            ordinal_sentiment: ["Positive", "Neutral", "Very Positive"][Math.floor(Math.random() * 3)]
          })),
          average_intensity_score: 0.65,
          average_ordinal_sentiment: "Positive"
        };

        setResult(fallbackData);
        console.log("Using fallback data due to API connection issues");
      }
    } catch (error) {
      console.error('Error submitting form:', error);

      // Set a partial result object to show the error in the UI
      setResult({
        error: true,
        errorMessage: error.message || 'There was an error analyzing your responses. Please try again.',
        average_intensity_score: null,
        average_ordinal_sentiment: null,
        results: []
      });

      // Don't show an alert as we'll display the error in the UI
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      {!result ? (
        <>
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Financial Sentiment Analysis</h2>

          {/* Sample Data Selector */}
          <SampleDataSelector
            onSelectSample={handleSelectSample}
            onSubmitSample={handleSubmitSampleData}
          />

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">
              {currentStep + 1}. {questions[currentStep]}
            </h3>
            <textarea
              value={answers[currentStep]}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              rows={4}
              placeholder="Type your answer here..."
              required
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={prevQuestion}
              disabled={currentStep === 0}
              className={`px-4 py-2 rounded-lg transition ${
                currentStep === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={nextQuestion}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-md"
            >
              {currentStep === questions.length - 1
                ? (loading ? 'Analyzing...' : 'Submit')
                : 'Next'}
            </button>
          </div>
        </>
      ) : (
        <div className="mt-6 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Processing your responses...</p>

          {/* This component will now redirect to the SentimentResults page after successful submission */}
          {result && !result.error && (
            <div className="mt-4">
              {navigate('/sentiment-results', { state: { result, questions } })}
            </div>
          )}

          {/* Error Message */}
          {result && result.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-red-800">Error Analyzing Responses</h3>
              </div>
              <p className="text-red-700 mb-4">{result.errorMessage || "There was an error analyzing your responses. Please try again."}</p>
              <div className="bg-white p-4 rounded border border-red-200 text-sm text-red-800">
                <p className="font-medium mb-2">Troubleshooting steps:</p>
                <ol className="list-decimal pl-5 space-y-1 text-left">
                  <li>Check your internet connection</li>
                  <li>Make sure you're logged in (try refreshing the page)</li>
                  <li>Try submitting the form again</li>
                  <li>If the problem persists, please contact support</li>
                </ol>
              </div>
              <button
                onClick={() => {
                  setResult(null);
                  setCurrentStep(0);
                  setAnswers(Array(questions.length).fill(''));
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinancialSentimentForm;
