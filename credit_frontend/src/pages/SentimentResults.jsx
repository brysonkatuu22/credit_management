import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const SentimentResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, questions } = location.state || { result: null, questions: [] };

  // If no result data is available, redirect to the form
  if (!result || !result.results) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">No Results Available</h2>
          <p className="text-gray-600 mb-6">No sentiment analysis results were found. Please complete the analysis form first.</p>
          <button 
            onClick={() => navigate('/sentiment-analysis')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            Go to Sentiment Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analysis Results</h1>
        <button
          onClick={() => navigate('/sentiment-dashboard')}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
        >
          Go to Dashboard
        </button>
      </div>

      {/* Overall Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Overall Analysis</h3>

        {result && result.average_intensity_score !== undefined && result.average_ordinal_sentiment ? (
          <>
            <div className="mb-4">
              <p className="text-gray-700 mb-2"><strong>Average Sentiment Score:</strong></p>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div
                  className={`h-4 rounded-full ${
                    result.average_intensity_score > 0.6 ? 'bg-green-500' :
                    result.average_intensity_score > 0.3 ? 'bg-yellow-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${(result.average_intensity_score + 1) / 2 * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">{((result.average_intensity_score + 1) / 2 * 100).toFixed(2)}%</p>
            </div>

            <p className="text-lg font-medium">
              <strong>Overall Sentiment:</strong>
              <span className={`ml-2 px-3 py-1 rounded-full text-white ${
                result.average_ordinal_sentiment === 'Positive' || result.average_ordinal_sentiment === 'Very Positive' ? 'bg-green-500' :
                result.average_ordinal_sentiment === 'Neutral' ? 'bg-yellow-400' : 'bg-red-500'
              }`}>
                {result.average_ordinal_sentiment}
              </span>
            </p>

            <p className="mt-4 text-gray-700">
              Based on your responses, your overall financial sentiment appears to be
              <strong> {result.average_ordinal_sentiment.toLowerCase()}</strong>.
              {result.average_ordinal_sentiment === 'Positive' || result.average_ordinal_sentiment === 'Very Positive'
                ? ' This suggests you generally feel confident about your financial situation and loan repayment abilities.'
                : result.average_ordinal_sentiment === 'Neutral'
                ? ' This suggests you have mixed feelings about your financial situation and loan repayment abilities.'
                : ' This suggests you may have concerns about your financial situation and loan repayment abilities.'}
            </p>
          </>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Analyzing your responses...</p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => {
            // Navigate to detailed results page with the result data
            navigate('/detailed-results', { state: { result, questions } });
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md flex-1"
          disabled={!result?.results || result.results.length === 0}
        >
          View Detailed Results
        </button>

        <button
          onClick={() => navigate('/sentiment-dashboard')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md flex-1"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SentimentResults;
