"""
Test script for credit report email functionality
This script tests the email functionality by generating a report for a specific user
and sending it via email.
"""

import os
import sys
import django
import logging
from pathlib import Path
from dotenv import load_dotenv

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('test_email')

# Setup Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'credit_project.settings')
django.setup()

# Import necessary modules
from django.contrib.auth import get_user_model
from rpa_automation.email_utils import send_report_email
from credit_report.utils import generate_pdf_report
from django.conf import settings

# Load environment variables
load_dotenv()

User = get_user_model()

def test_email_report(user_email):
    """
    Test generating a report for a user and sending it via email
    
    Args:
        user_email (str): Email of the user to generate a report for
    """
    try:
        # Find the user
        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            logger.error(f"User with email {user_email} not found")
            return False
        
        # Create the reports directory if it doesn't exist
        reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        # Generate a report
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{user.email}_Test_Report_{timestamp}.pdf"
        file_path = os.path.join(reports_dir, filename)
        
        logger.info(f"Generating report for user: {user.email}")
        generate_pdf_report(user, file_path)
        logger.info(f"Report generated successfully: {file_path}")
        
        # Send the email
        user_name = f"{user.first_name} {user.last_name}".strip() if hasattr(user, 'first_name') else None
        logger.info(f"Sending email to {user.email}")
        
        if send_report_email(user.email, file_path, user_name):
            logger.info("Email sent successfully")
            return True
        else:
            logger.error("Failed to send email")
            return False
            
    except Exception as e:
        logger.error(f"Error in test_email_report: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_email_report.py <user_email>")
        sys.exit(1)
    
    user_email = sys.argv[1]
    result = test_email_report(user_email)
    
    if result:
        print(f"✅ Successfully generated and emailed report to {user_email}")
        sys.exit(0)
    else:
        print(f"❌ Failed to generate or email report to {user_email}")
        sys.exit(1)
