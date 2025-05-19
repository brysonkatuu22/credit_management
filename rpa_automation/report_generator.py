"""
RPA Automation for Credit Loan Report Generation
This script automates the process of generating credit loan reports for all users
or specific user groups based on configured criteria.
"""

import os
import sys
import django
import logging
from datetime import datetime, timedelta
import schedule
import time
from pathlib import Path
from dotenv import load_dotenv

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'credit_project.settings')
django.setup()

# Now we can import Django models
from django.contrib.auth import get_user_model
from credit_report.utils import generate_pdf_report
from django.conf import settings
from loan.models import LoanAccount
from credit_report.models import CreditReportRequest
from rpa_automation.email_utils import send_report_email, send_batch_report_emails

# Create logs directory if it doesn't exist
logs_dir = os.path.join(BASE_DIR, 'logs')
os.makedirs(logs_dir, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(logs_dir, 'rpa_report_generator.log')),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('rpa_report_generator')

# Load environment variables
load_dotenv()

User = get_user_model()

def ensure_directories():
    """Ensure necessary directories exist"""
    reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
    logs_dir = os.path.join(BASE_DIR, "logs")

    for directory in [reports_dir, logs_dir]:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"Ensured directory exists: {directory}")

def get_users_for_report_generation(criteria=None):
    """
    Get users who need reports generated based on criteria

    Args:
        criteria (str): Options include 'all', 'active_loans', 'due_loans', or None (defaults to 'all')

    Returns:
        list: List of user objects
    """
    if criteria == 'active_loans':
        # Get users with active loans
        users_with_loans = User.objects.filter(
            loan_accounts__status='active'
        ).distinct()
        return users_with_loans

    elif criteria == 'due_loans':
        # Get users with loans due in the next 30 days
        today = datetime.now().date()
        thirty_days_later = today + timedelta(days=30)

        users_with_due_loans = User.objects.filter(
            loan_accounts__end_date__range=[today, thirty_days_later],
            loan_accounts__status='active'
        ).distinct()
        return users_with_due_loans

    else:  # Default to all users
        return User.objects.all()

def generate_reports_batch(criteria=None, email_reports=False):
    """
    Generate reports for a batch of users based on criteria

    Args:
        criteria (str): User selection criteria ('all', 'active_loans', 'due_loans')
        email_reports (bool): Whether to email reports to users

    Returns:
        tuple: (success_count, error_count)
    """
    ensure_directories()

    users = get_users_for_report_generation(criteria)
    logger.info(f"Starting batch report generation for {users.count()} users")

    reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
    success_count = 0
    error_count = 0
    email_success = 0
    email_error = 0

    # List to store user-report pairs for batch email sending
    user_report_pairs = []

    for user in users:
        try:
            # Create filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"{user.email}_Loan_Report_{timestamp}.pdf"
            file_path = os.path.join(reports_dir, filename)

            # Generate the report
            generate_pdf_report(user, file_path)

            # Create a record in the CreditReportRequest model
            report_request = CreditReportRequest(user=user)

            # Save the file path to the model
            with open(file_path, 'rb') as f:
                from django.core.files.base import ContentFile
                report_request.report_file.save(filename, ContentFile(f.read()), save=True)

            # Save the record
            report_request.save()

            logger.info(f"Successfully generated report for user: {user.email}")
            success_count += 1

            # Add to the list for email sending if requested
            if email_reports:
                user_report_pairs.append((user, file_path))

        except Exception as e:
            logger.error(f"Failed to generate report for user {user.email}: {str(e)}")
            error_count += 1

    # Send emails if requested
    if email_reports and user_report_pairs:
        logger.info(f"Sending {len(user_report_pairs)} emails with credit reports...")

        # Send emails individually for better error tracking
        for user, report_path in user_report_pairs:
            try:
                # Get user's full name if available
                user_name = f"{user.first_name} {user.last_name}".strip() if hasattr(user, 'first_name') else None

                # Send the email
                if send_report_email(user.email, report_path, user_name):
                    email_success += 1
                    logger.info(f"Successfully sent credit report email to {user.email}")
                else:
                    email_error += 1
                    logger.error(f"Failed to send credit report email to {user.email}")
            except Exception as e:
                email_error += 1
                logger.error(f"Error sending email to {user.email}: {str(e)}")

        logger.info(f"Email sending completed. Success: {email_success}, Errors: {email_error}")

    logger.info(f"Batch report generation completed. Success: {success_count}, Errors: {error_count}")
    if email_reports:
        logger.info(f"Email sending results: Success: {email_success}, Errors: {email_error}")

    return success_count, error_count

def schedule_daily_reports():
    """Schedule daily report generation at a specific time"""
    # Get time from environment variable or use default (2 AM)
    report_time = os.getenv('REPORT_GENERATION_TIME', '02:00')

    # Schedule the job
    schedule.every().day.at(report_time).do(
        generate_reports_batch,
        criteria='active_loans',
        email_reports=True
    )

    logger.info(f"Scheduled daily report generation at {report_time}")

    # Keep the script running
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute

def generate_reports_for_all_users():
    """Generate reports for all users (one-time run)"""
    return generate_reports_batch(criteria='all')

def generate_reports_for_users_with_due_loans():
    """Generate reports for users with loans due soon (one-time run)"""
    return generate_reports_batch(criteria='due_loans')

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='RPA Credit Loan Report Generator')
    parser.add_argument('--mode', choices=['schedule', 'all', 'due', 'active'],
                        default='schedule',
                        help='Operation mode: schedule (run as service), all (generate for all users), '
                             'due (generate for users with due loans), active (generate for users with active loans)')

    args = parser.parse_args()

    if args.mode == 'schedule':
        logger.info("Starting scheduled report generation service")
        schedule_daily_reports()
    elif args.mode == 'all':
        logger.info("Generating reports for all users")
        generate_reports_for_all_users()
    elif args.mode == 'due':
        logger.info("Generating reports for users with due loans")
        generate_reports_for_users_with_due_loans()
    elif args.mode == 'active':
        logger.info("Generating reports for users with active loans")
        generate_reports_batch(criteria='active_loans')
