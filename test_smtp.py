"""
Simple SMTP test script
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv('rpa_automation/.env')

# Get email configuration
smtp_server = os.getenv('SMTP_SERVER')
smtp_port = int(os.getenv('SMTP_PORT', 587))
smtp_username = os.getenv('SMTP_USERNAME')
smtp_password = os.getenv('SMTP_PASSWORD')
sender_email = os.getenv('SENDER_EMAIL', smtp_username)

print(f"SMTP Server: {smtp_server}")
print(f"SMTP Port: {smtp_port}")
print(f"Username: {smtp_username}")
print(f"Password: {'*' * len(smtp_password) if smtp_password else 'Not set'}")

# Create a simple message
msg = MIMEMultipart()
msg['From'] = sender_email
msg['To'] = smtp_username  # Send to yourself for testing
msg['Subject'] = "SMTP Test Email"

body = "This is a test email to verify SMTP connection."
msg.attach(MIMEText(body, 'plain'))

try:
    # Connect to the server
    print(f"Connecting to {smtp_server}:{smtp_port}...")

    if smtp_port == 465:  # SSL connection
        print("Using SSL connection...")
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)
    else:  # TLS connection (usually port 587)
        print("Using TLS connection...")
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.ehlo()
        print("Starting TLS...")
        server.starttls()
        server.ehlo()

    # Login
    print(f"Logging in as {smtp_username}...")
    server.login(smtp_username, smtp_password)

    # Send email
    print("Sending email...")
    server.send_message(msg)

    # Close connection
    server.quit()
    print("Email sent successfully!")

except Exception as e:
    print(f"Error: {str(e)}")
