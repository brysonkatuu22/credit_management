import { render, screen, waitFor } from '@testing-library/react';
import AdminReportAutomation from './AdminReportAutomation';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock CSS modules
jest.mock('./AdminReportAutomation.css', () => ({}));

describe('AdminReportAutomation', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'fake-token'),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });

    // Mock document.createElement for the download link
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'a') {
        return {
          href: '',
          target: '',
          click: jest.fn()
        };
      }
      return {};
    });

    // Mock getBoundingClientRect for animation elements
    Element.prototype.getBoundingClientRect = jest.fn(() => {
      return {
        width: 100,
        height: 50,
        top: 100,
        left: 100,
        bottom: 150,
        right: 200,
        x: 100,
        y: 100
      };
    });

    // Mock window.scrollTo
    window.scrollTo = jest.fn();

    // Mock timers
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should search for user and show error when no users found', async () => {
    // Mock axios to return empty results
    axios.get.mockResolvedValueOnce({ data: [] });

    const onErrorMock = jest.fn();

    render(
      <AdminReportAutomation
        userEmail="nonexistent@example.com"
        onError={onErrorMock}
      />
    );

    // Fast-forward timers
    jest.runAllTimers();

    // Wait for the error to be called
    await waitFor(() => {
      expect(onErrorMock).toHaveBeenCalledWith(
        expect.stringContaining('No users found with email')
      );
    });

    // Verify axios was called with correct parameters
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('search-users/?email=nonexistent@example.com'),
      expect.any(Object)
    );
  });

  test('should complete the full automation process successfully', async () => {
    // Mock successful user search
    axios.get.mockResolvedValueOnce({
      data: [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        date_joined: '2023-01-01T00:00:00Z'
      }]
    });

    // Mock successful report generation
    axios.post.mockResolvedValueOnce({
      data: {
        message: 'Report generated successfully',
        report_url: '/media/reports/test_report.pdf'
      }
    });

    const onCompleteMock = jest.fn();

    render(
      <AdminReportAutomation
        userEmail="test@example.com"
        onComplete={onCompleteMock}
        autoDownload={true}
      />
    );

    // Fast-forward timers to complete all animations and API calls
    jest.runAllTimers();

    // Wait for the completion callback to be called
    await waitFor(() => {
      expect(onCompleteMock).toHaveBeenCalledWith(
        expect.objectContaining({
          reportUrl: '/media/reports/test_report.pdf',
          user: expect.objectContaining({
            email: 'test@example.com'
          })
        })
      );
    });

    // Verify axios calls
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('search-users/?email=test@example.com'),
      expect.any(Object)
    );

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('admin/generate-report/'),
      { user_email: 'test@example.com' },
      expect.any(Object)
    );
  });

  test('should display visual elements during automation', async () => {
    // Mock successful user search
    axios.get.mockResolvedValueOnce({
      data: [{
        id: 1,
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        date_joined: '2023-01-01T00:00:00Z'
      }]
    });

    // Mock successful report generation
    axios.post.mockResolvedValueOnce({
      data: {
        message: 'Report generated successfully',
        report_url: '/media/reports/test_report.pdf'
      }
    });

    render(
      <AdminReportAutomation
        userEmail="test@example.com"
        onComplete={() => {}}
        autoDownload={true}
      />
    );

    // Check for progress bar
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Check for cursor element
    jest.advanceTimersByTime(1000);
    expect(document.querySelector('.automation-cursor')).not.toBeNull();

    // Check for simulation elements
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    // Advance to show generate button
    jest.advanceTimersByTime(3000);
    expect(screen.getByText('Generate Report')).toBeInTheDocument();

    // Complete the process
    jest.runAllTimers();

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Automation Completed')).toBeInTheDocument();
    });
  });
});
