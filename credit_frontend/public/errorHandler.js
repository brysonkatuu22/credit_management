// Global error handler to catch unhandled JavaScript errors
window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error caught:', {
    message: message,
    source: source,
    lineno: lineno,
    colno: colno,
    error: error
  });

  // Show a user-friendly error message
  if (!document.getElementById('error-container')) {
    const rootElement = document.getElementById('root');
    if (rootElement) {
      // Clear any content that might be causing errors
      rootElement.innerHTML = '';

      // Create error container
      const errorContainer = document.createElement('div');
      errorContainer.id = 'error-container';
      errorContainer.style.padding = '20px';
      errorContainer.style.margin = '20px auto';
      errorContainer.style.maxWidth = '600px';
      errorContainer.style.backgroundColor = '#fff';
      errorContainer.style.borderRadius = '8px';
      errorContainer.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      errorContainer.style.textAlign = 'center';

      // Add error message
      const errorTitle = document.createElement('h2');
      errorTitle.textContent = 'Something went wrong';
      errorTitle.style.color = '#e53e3e';
      errorTitle.style.marginBottom = '16px';

      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'We encountered an error while loading the application. Please try refreshing the page.';
      errorMessage.style.marginBottom = '20px';

      // Add refresh button
      const refreshButton = document.createElement('button');
      refreshButton.textContent = 'Refresh Page';
      refreshButton.style.padding = '8px 16px';
      refreshButton.style.backgroundColor = '#3182ce';
      refreshButton.style.color = 'white';
      refreshButton.style.border = 'none';
      refreshButton.style.borderRadius = '4px';
      refreshButton.style.cursor = 'pointer';
      refreshButton.style.marginRight = '8px';
      refreshButton.onclick = function() {
        window.location.reload();
      };

      // Add go to home button
      const homeButton = document.createElement('button');
      homeButton.textContent = 'Go to Dashboard';
      homeButton.style.padding = '8px 16px';
      homeButton.style.backgroundColor = 'transparent';
      homeButton.style.color = '#3182ce';
      homeButton.style.border = '1px solid #3182ce';
      homeButton.style.borderRadius = '4px';
      homeButton.style.cursor = 'pointer';
      homeButton.onclick = function() {
        window.location.href = '/dashboard';
      };

      // Add technical details (only in development)
      if (message && source) {
        const technicalDetails = document.createElement('div');
        technicalDetails.style.marginTop = '20px';
        technicalDetails.style.padding = '12px';
        technicalDetails.style.backgroundColor = '#f7fafc';
        technicalDetails.style.borderRadius = '4px';
        technicalDetails.style.fontSize = '14px';
        technicalDetails.style.textAlign = 'left';

        const errorInfo = document.createElement('pre');
        errorInfo.textContent = `Error: ${message}\nLocation: ${source}:${lineno}:${colno}`;
        errorInfo.style.whiteSpace = 'pre-wrap';
        errorInfo.style.wordBreak = 'break-word';
        errorInfo.style.margin = '0';

        // Add specific troubleshooting tips for common errors
        let troubleshootingTips = '';

        // Check for process.env related errors (common in Vite apps)
        if (message.includes('process is not defined') || message.includes('process.env')) {
          troubleshootingTips = `
Troubleshooting Tips:
- In Vite, use 'import.meta.env.VITE_VARIABLE_NAME' instead of 'process.env.REACT_APP_VARIABLE_NAME'
- Make sure environment variables are prefixed with 'VITE_' in your .env file
- Check that you have a .env file in the project root directory
`;
        }
        // Check for module loading errors
        else if (message.includes('Failed to load module') || message.includes('Cannot find module')) {
          troubleshootingTips = `
Troubleshooting Tips:
- Check that all dependencies are installed (run 'npm install')
- Verify import paths are correct (case-sensitive)
- Restart the development server
`;
        }
        // Check for syntax errors
        else if (message.includes('Unexpected token') || message.includes('Unexpected identifier')) {
          troubleshootingTips = `
Troubleshooting Tips:
- Look for syntax errors like missing brackets, commas, or semicolons
- Check for typos in variable or function names
- Ensure all JSX elements are properly closed
`;
        }

        // Add troubleshooting tips if available
        if (troubleshootingTips) {
          const tips = document.createElement('div');
          tips.style.marginTop = '10px';
          tips.style.padding = '10px';
          tips.style.backgroundColor = '#ebf8ff';
          tips.style.borderRadius = '4px';
          tips.style.border = '1px solid #bee3f8';

          const tipsContent = document.createElement('pre');
          tipsContent.textContent = troubleshootingTips;
          tipsContent.style.whiteSpace = 'pre-wrap';
          tipsContent.style.wordBreak = 'break-word';
          tipsContent.style.margin = '0';
          tipsContent.style.fontSize = '12px';

          tips.appendChild(tipsContent);
          technicalDetails.appendChild(errorInfo);
          technicalDetails.appendChild(tips);
        } else {
          technicalDetails.appendChild(errorInfo);
        }

        errorContainer.appendChild(errorTitle);
        errorContainer.appendChild(errorMessage);
        errorContainer.appendChild(refreshButton);
        errorContainer.appendChild(homeButton);
        errorContainer.appendChild(technicalDetails);
      } else {
        errorContainer.appendChild(errorTitle);
        errorContainer.appendChild(errorMessage);
        errorContainer.appendChild(refreshButton);
        errorContainer.appendChild(homeButton);
      }

      rootElement.appendChild(errorContainer);
    }
  }

  // Return true to prevent the default browser error handler
  return true;
};

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);

  // Trigger the same error handler as for regular errors
  window.onerror('Unhandled Promise Rejection', 'promise', 0, 0, event.reason);
});
