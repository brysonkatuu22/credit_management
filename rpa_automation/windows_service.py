"""
Windows Service for Credit Loan Report RPA Automation
This script allows the RPA automation to run as a Windows service.
"""

import os
import sys
import time
import logging
import servicemanager
import socket
import win32event
import win32service
import win32serviceutil

# Add the parent directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import the report generator module
from rpa_automation.report_generator import schedule_daily_reports

class ReportGeneratorService(win32serviceutil.ServiceFramework):
    _svc_name_ = "CreditLoanReportGenerator"
    _svc_display_name_ = "Credit Loan Report Generator Service"
    _svc_description_ = "Automatically generates credit loan reports using RPA"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        socket.setdefaulttimeout(60)
        self.is_running = True
        
        # Configure logging
        log_dir = os.path.join(parent_dir, 'logs')
        os.makedirs(log_dir, exist_ok=True)
        
        self.logger = logging.getLogger('ReportGeneratorService')
        self.logger.setLevel(logging.INFO)
        
        handler = logging.FileHandler(os.path.join(log_dir, 'report_service.log'))
        formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_running = False
        self.logger.info('Service stop requested')

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()

    def main(self):
        self.logger.info('Service starting')
        try:
            # Start the scheduled report generation
            schedule_daily_reports()
        except Exception as e:
            self.logger.error(f'Error in service: {str(e)}')
            servicemanager.LogErrorMsg(f"Error in {self._svc_name_}: {str(e)}")

if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(ReportGeneratorService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(ReportGeneratorService)
