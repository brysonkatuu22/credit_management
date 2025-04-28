"""
Email utilities for sending credit loan reports
"""

import os
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger('rpa_email_utils')

def send_report_email(recipient_email, report_path, user_name=None):
    """
    Send an email with the credit report attached
    
    Args:
        recipient_email (str): Email address of the recipient
        report_path (str): Path to the report file
        user_name (str, optional): Name of the user for personalization
    
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    # Get email configuration from environment variables
    smtp_server = os.getenv('SMTP_SERVER')
    smtp_port = int(os.getenv('SMTP_PORT', 587))
    smtp_username = os.getenv('SMTP_USERNAME')
    smtp_password = os.getenv('SMTP_PASSWORD')
    sender_email = os.getenv('SENDER_EMAIL', smtp_username)
    
    # Check if email configuration is available
    if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
        logger.error("Email configuration is incomplete. Check environment variables.")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = "Your Credit Loan Report"
        
        # Email body
        greeting = f"Hello {user_name}," if user_name else "Hello,"
        body = f"""{greeting}

Please find attached your latest credit loan report. This report provides a comprehensive view of your loan accounts.

If you have any questions about this report, please don't hesitate to contact our support team.

Thank you for using our services.

Best regards,
Fintrack Solutions Team
"""
        msg.attach(MIMEText(body, 'plain'))
        
        # Attach the report
        with open(report_path, 'rb') as file:
            attachment = MIMEApplication(file.read(), _subtype="pdf")
            attachment.add_header('Content-Disposition', 'attachment', filename=os.path.basename(report_path))
            msg.attach(attachment)
        
        # Connect to server and send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(msg)
        
        logger.info(f"Successfully sent report email to {recipient_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_email}: {str(e)}")
        return False

def send_batch_report_emails(user_report_pairs):
    """
    Send reports to multiple users
    
    Args:
        user_report_pairs (list): List of tuples containing (user, report_path)
    
    Returns:
        tuple: (success_count, error_count)
    """
    success_count = 0
    error_count = 0
    
    for user, report_path in user_report_pairs:
        try:
            if send_report_email(user.email, report_path, user.get_full_name()):
                success_count += 1
            else:
                error_count += 1
        except Exception as e:
            logger.error(f"Error in send_batch_report_emails: {str(e)}")
            error_count += 1
    
    return success_count, error_count
