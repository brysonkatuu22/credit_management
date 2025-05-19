"""
Very simple email test using Gmail
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Replace these with your actual Gmail credentials
sender_email = "brysonkatuu@gmail.com"  # Your Gmail address
receiver_email = "brysonkatuu@gmail.com"  # Where you want to send the test email
password = "your_app_password_here"  # Your Gmail App Password

# Create message
msg = MIMEMultipart()
msg['From'] = sender_email
msg['To'] = receiver_email
msg['Subject'] = "Test Email from Python"

# Email body
body = "This is a test email sent from Python."
msg.attach(MIMEText(body, 'plain'))

try:
    # Connect to Gmail's SMTP server
    print("Connecting to Gmail's SMTP server...")
    
    # Using SSL (port 465)
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        # Login
        print("Logging in...")
        server.login(sender_email, password)
        
        # Send email
        print("Sending email...")
        server.send_message(msg)
        
    print("Email sent successfully!")
    
except Exception as e:
    print(f"Error: {str(e)}")
