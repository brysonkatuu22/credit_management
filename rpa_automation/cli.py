"""
Command Line Interface for Credit Loan Report RPA Automation
This module provides a command-line interface for generating and emailing credit reports.
"""

import os
import sys
import argparse
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('rpa_cli')

# Add the parent directory to sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

# Import the report generator functions
from rpa_automation.report_generator import (
    generate_reports_batch,
    schedule_daily_reports,
    generate_reports_for_all_users,
    generate_reports_for_users_with_due_loans
)

# Import the Windows service installer
try:
    from rpa_automation.windows_service import CreditReportService
    import win32serviceutil
    WINDOWS_SERVICE_AVAILABLE = True
except ImportError:
    WINDOWS_SERVICE_AVAILABLE = False
    logger.warning("Windows service functionality not available. Required modules not installed.")


def main():
    """Main entry point for the CLI"""
    parser = argparse.ArgumentParser(description='Credit Loan Report RPA Automation')
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    # Generate command
    generate_parser = subparsers.add_parser('generate', help='Generate credit reports')
    generate_parser.add_argument(
        'criteria',
        choices=['all', 'due', 'active'],
        help='User criteria for report generation'
    )
    generate_parser.add_argument(
        '--email',
        action='store_true',
        help='Send reports via email after generation'
    )

    # Schedule command
    schedule_parser = subparsers.add_parser('schedule', help='Run as a scheduled service')

    # Service command (Windows only)
    if WINDOWS_SERVICE_AVAILABLE:
        service_parser = subparsers.add_parser('install-service', help='Install as a Windows service')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == 'generate':
        if args.criteria == 'all':
            logger.info("Generating reports for all users")
            generate_reports_batch(criteria='all', email_reports=args.email)
        elif args.criteria == 'due':
            logger.info("Generating reports for users with due loans")
            generate_reports_batch(criteria='due_loans', email_reports=args.email)
        elif args.criteria == 'active':
            logger.info("Generating reports for users with active loans")
            generate_reports_batch(criteria='active_loans', email_reports=args.email)

    elif args.command == 'schedule':
        logger.info("Starting scheduled report generation service")
        schedule_daily_reports()

    elif args.command == 'install-service' and WINDOWS_SERVICE_AVAILABLE:
        logger.info("Installing Windows service")
        try:
            win32serviceutil.HandleCommandLine(CreditReportService)
        except Exception as e:
            logger.error(f"Failed to install service: {str(e)}")


if __name__ == "__main__":
    main()
