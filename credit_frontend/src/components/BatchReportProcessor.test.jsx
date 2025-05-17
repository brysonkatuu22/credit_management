import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchReportProcessor from './BatchReportProcessor';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock AdminReportAutomation component
jest.mock('./AdminReportAutomation', () => {
  return function MockAdminReportAutomation({ userEmail, onComplete, onError }) {
    return (
      <div data-testid="mock-automation">
        <button 
          data-testid="mock-complete-button" 
          onClick={() => onComplete({ 
            reportUrl: '/media/reports/test_report.pdf',
            user: { 
              email: userEmail, 
              first_name: 'Test', 
              last_name: 'User' 
            }
          })}
        >
          Complete
        </button>
        <button 
          data-testid="mock-error-button" 
          onClick={() => onError('Error processing report')}
        >
          Error
        </button>
      </div>
    );
  };
});

// Mock CSS modules
jest.mock('./BatchReportProcessor.css', () => ({}));
jest.mock('./AdminReportAutomation.css', () => ({}));

describe('BatchReportProcessor', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders email input textarea', () => {
    render(<BatchReportProcessor />);
    
    const textarea = screen.getByPlaceholderText(/user1@example.com/);
    expect(textarea).toBeInTheDocument();
  });

  test('parses email addresses correctly', () => {
    render(<BatchReportProcessor />);
    
    const textarea = screen.getByPlaceholderText(/user1@example.com/);
    
    // Test comma-separated emails
    fireEvent.change(textarea, { target: { value: 'user1@example.com, user2@example.com' } });
    expect(screen.getByText(/2 valid emails found/)).toBeInTheDocument();
    
    // Test newline-separated emails
    fireEvent.change(textarea, { target: { value: 'user1@example.com\nuser2@example.com\nuser3@example.com' } });
    expect(screen.getByText(/3 valid emails found/)).toBeInTheDocument();
    
    // Test semicolon-separated emails
    fireEvent.change(textarea, { target: { value: 'user1@example.com; user2@example.com; user3@example.com; user4@example.com' } });
    expect(screen.getByText(/4 valid emails found/)).toBeInTheDocument();
    
    // Test mixed separators
    fireEvent.change(textarea, { target: { value: 'user1@example.com, user2@example.com;\nuser3@example.com' } });
    expect(screen.getByText(/3 valid emails found/)).toBeInTheDocument();
  });

  test('starts batch processing when button is clicked', () => {
    render(<BatchReportProcessor />);
    
    const textarea = screen.getByPlaceholderText(/user1@example.com/);
    fireEvent.change(textarea, { target: { value: 'user1@example.com, user2@example.com' } });
    
    const startButton = screen.getByText('Start Batch Processing');
    fireEvent.click(startButton);
    
    // Check if processing has started
    expect(screen.getByText('Currently Processing:')).toBeInTheDocument();
    expect(screen.getByText('Processing 1 of 2 emails')).toBeInTheDocument();
  });

  test('processes multiple emails and shows results', async () => {
    const onCompleteMock = jest.fn();
    
    render(<BatchReportProcessor onComplete={onCompleteMock} />);
    
    // Enter emails
    const textarea = screen.getByPlaceholderText(/user1@example.com/);
    fireEvent.change(textarea, { target: { value: 'user1@example.com, user2@example.com' } });
    
    // Start processing
    const startButton = screen.getByText('Start Batch Processing');
    fireEvent.click(startButton);
    
    // Simulate completion of first report
    const completeButton = screen.getAllByTestId('mock-complete-button')[0];
    fireEvent.click(completeButton);
    
    // Check if first report is in the results
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
    
    // Simulate error for second report
    const errorButton = screen.getAllByTestId('mock-error-button')[0];
    fireEvent.click(errorButton);
    
    // Check if both reports are in the results
    await waitFor(() => {
      expect(screen.getAllByText(/user[12]@example.com/).length).toBe(2);
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
    
    // Check if batch summary is shown
    expect(screen.getByText('Batch Summary')).toBeInTheDocument();
    expect(screen.getByText('Total Processed:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total count
    expect(screen.getByText('1')).toBeInTheDocument(); // Success count
    
    // Complete the batch
    const completeButton2 = screen.getByText('Complete');
    fireEvent.click(completeButton2);
    
    // Check if onComplete was called with results
    expect(onCompleteMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          email: 'user1@example.com',
          status: 'success'
        }),
        expect.objectContaining({
          email: 'user2@example.com',
          status: 'error'
        })
      ])
    );
  });

  test('shows error when no emails are entered', () => {
    render(<BatchReportProcessor />);
    
    const startButton = screen.getByText('Start Batch Processing');
    fireEvent.click(startButton);
    
    expect(screen.getByText('Please enter at least one valid email address')).toBeInTheDocument();
  });

  test('allows canceling the batch process', () => {
    const onCancelMock = jest.fn();
    
    render(<BatchReportProcessor onCancel={onCancelMock} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(onCancelMock).toHaveBeenCalled();
  });
});
