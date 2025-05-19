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
    company_name = os.getenv('COMPANY_NAME', 'Fintrack Solutions')

    # Check if email configuration is available
    if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
        logger.error("Email configuration is incomplete. Check environment variables.")
        return False

    try:
        # Create message
        msg = MIMEMultipart('related')
        msg['From'] = f"{company_name} <{sender_email}>"
        msg['To'] = recipient_email
        msg['Subject'] = "Your Credit Report - Fintrack Solutions"

        # Create HTML email body
        greeting = f"Hello {user_name}," if user_name else "Hello,"

        # Get the current date for the email
        from datetime import datetime
        current_date = datetime.now().strftime("%B %d, %Y")

        # Create HTML email with inline styling
        html_body = f"""
        <html>
        <head>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #1a73e8;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    padding: 20px;
                    background-color: #ffffff;
                    border-left: 1px solid #dddddd;
                    border-right: 1px solid #dddddd;
                }}
                .footer {{
                    background-color: #f5f5f5;
                    padding: 15px;
                    text-align: center;
                    font-size: 12px;
                    color: #777777;
                    border-radius: 0 0 5px 5px;
                    border: 1px solid #dddddd;
                }}
                .button {{
                    display: inline-block;
                    background-color: #1a73e8;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 15px;
                }}
                .highlight {{
                    color: #1a73e8;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Credit Report</h1>
                    <p>Your financial insights at a glance</p>
                </div>
                <div class="content">
                    <p>{greeting}</p>

                    <p>Your <span class="highlight">Credit Report</span> for <span class="highlight">{current_date}</span> is now available.</p>

                    <p>This report provides a comprehensive analysis of your credit profile, including:</p>

                    <ul>
                        <li>Current credit score and rating</li>
                        <li>Detailed loan account information</li>
                        <li>Payment history and trends</li>
                        <li>Recommendations for improving your credit score</li>
                    </ul>

                    <p>Please find your report attached to this email. You can also view your report by logging into your account on our website.</p>

                    <p>If you have any questions about your report or need assistance understanding any part of it, our support team is ready to help.</p>

                    <p>Thank you for choosing {company_name} for your financial management needs.</p>

                    <p>Best regards,<br>
                    The {company_name} Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated email. Please do not reply to this message.</p>
                    <p>&copy; {datetime.now().year} {company_name}. All rights reserved.</p>
                    <p>
                        <a href="https://www.fintrack.com/privacy">Privacy Policy</a> |
                        <a href="https://www.fintrack.com/terms">Terms of Service</a>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Add HTML version to the email
        msg.attach(MIMEText(html_body, 'html'))

        # Also include a plain text version for email clients that don't support HTML
        plain_text = f"""{greeting}

Your Credit Report for {current_date} is now available.

This report provides a comprehensive analysis of your credit profile, including:
- Current credit score and rating
- Detailed loan account information
- Payment history and trends
- Recommendations for improving your credit score

Please find your report attached to this email. You can also view your report by logging into your account on our website.

If you have any questions about your report or need assistance understanding any part of it, our support team is ready to help.

Thank you for choosing {company_name} for your financial management needs.

Best regards,
The {company_name} Team

---
This is an automated email. Please do not reply to this message.
© {datetime.now().year} {company_name}. All rights reserved.
"""
        msg.attach(MIMEText(plain_text, 'plain'))

        # Attach the report
        with open(report_path, 'rb') as file:
            attachment = MIMEApplication(file.read(), _subtype="pdf")
            attachment.add_header('Content-Disposition', 'attachment',
                                 filename=os.path.basename(report_path))
            msg.attach(attachment)

        # Connect to server and send email
        if smtp_port == 465:  # SSL connection
            with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                server.login(smtp_username, smtp_password)
                server.send_message(msg)
        else:  # TLS connection (usually port 587)
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
