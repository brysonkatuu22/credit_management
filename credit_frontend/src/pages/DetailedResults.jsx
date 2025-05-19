import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const DetailedResults = () => {
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
          <Link to="/sentiment-form" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-md">
            Go to Sentiment Form
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Detailed Response Analysis</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/sentiment-results', { state: { result, questions } })}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Results
          </button>
          <button
            onClick={() => navigate('/sentiment-dashboard')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-md"
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      {/* Overall Summary */}
      <div className="bg-blue-50 p-5 rounded-lg border border-blue-200 mb-8">
        <h2 className="text-xl font-semibold text-blue-800 mb-3">Overall Sentiment Summary</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
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
          <div className="flex-1">
            <p className="text-lg font-medium">
              <strong>Overall Sentiment:</strong>
              <span className={`ml-2 px-3 py-1 rounded-full text-white ${
                result.average_ordinal_sentiment === 'Positive' || result.average_ordinal_sentiment === 'Very Positive' ? 'bg-green-500' :
                result.average_ordinal_sentiment === 'Neutral' ? 'bg-yellow-400' : 'bg-red-500'
              }`}>
                {result.average_ordinal_sentiment}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Individual Response Analysis */}
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Individual Response Analysis</h2>

      <div className="space-y-6">
        {result.results.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 text-lg">Question {index + 1}</h3>
                <p className="text-gray-600 mt-1">{questions[index]}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-white text-sm ${
                item.ordinal_sentiment === 'Positive' || item.ordinal_sentiment === 'Very Positive' ? 'bg-green-500' :
                item.ordinal_sentiment === 'Neutral' ? 'bg-yellow-400' : 'bg-red-500'
              }`}>
                {item.ordinal_sentiment}
              </span>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
              <p className="text-gray-800 italic">"{item.text}"</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-sm font-medium text-green-800 mb-1">Positive</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${item.p_positive * 100}%` }}></div>
                </div>
                <p className="text-xs text-gray-600">{(item.p_positive * 100).toFixed(1)}%</p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <p className="text-sm font-medium text-yellow-800 mb-1">Neutral</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${item.p_neutral * 100}%` }}></div>
                </div>
                <p className="text-xs text-gray-600">{(item.p_neutral * 100).toFixed(1)}%</p>
              </div>

              <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                <p className="text-sm font-medium text-red-800 mb-1">Negative</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                  <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${item.p_negative * 100}%` }}></div>
                </div>
                <p className="text-xs text-gray-600">{(item.p_negative * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-700">
                <strong>Sentiment Score:</strong> {item.intensity_score.toFixed(2)}
                <span className="text-xs text-gray-500 ml-1">
                  (Range: -1 to 1, where -1 is very negative and 1 is very positive)
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={() => navigate('/sentiment-dashboard')}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition shadow-md"
        >
          View Sentiment Dashboard
        </button>
      </div>
    </div>
  );
};

export default DetailedResults;
