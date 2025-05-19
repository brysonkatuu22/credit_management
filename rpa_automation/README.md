# Credit Loan Report RPA Automation

This module provides Robotic Process Automation (RPA) for generating credit loan reports automatically.

## Features

- Automated generation of credit loan reports for all users or specific user groups
- Scheduled report generation at configurable times
- Email distribution of generated reports with professional HTML templates
- Automatic attachment of PDF credit reports to emails
- Windows service integration for continuous operation
- Command-line interface for manual execution

## Installation

1. Install the required dependencies:

```bash
pip install -r requirements_rpa.txt
```

2. Create a `.env` file based on the `.env.example` template:

```bash
cp .env.example .env
```

3. Edit the `.env` file with your specific configuration settings.

## Usage

### Command Line Interface

The module provides a command-line interface for easy execution:

```bash
# Generate reports for all users
python -m rpa_automation.cli generate all

# Generate reports for users with loans due soon
python -m rpa_automation.cli generate due

# Generate reports for users with active loans and email them
python -m rpa_automation.cli generate active --email

# Run as a scheduled service
python -m rpa_automation.cli schedule
```

### Windows Service

To install as a Windows service:

```bash
# Install the service
python -m rpa_automation.cli install-service

# Start the service
net start CreditLoanReportGenerator

# Stop the service
net stop CreditLoanReportGenerator

# Remove the service
sc delete CreditLoanReportGenerator
```

## Configuration

The following environment variables can be configured in the `.env` file:

- `REPORT_GENERATION_TIME`: Time of day to generate reports (default: 02:00)
- `SMTP_SERVER`: SMTP server for sending emails
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_USERNAME`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `SENDER_EMAIL`: Email address to send reports from
- `COMPANY_NAME`: Company name to use in email templates (default: Fintrack Solutions)

## Integration with Django

This RPA module integrates with the Django project by:

1. Setting up the Django environment
2. Using the existing `generate_pdf_report` function from `credit_report.utils`
3. Accessing user and loan data through Django models
4. Storing report generation records in the `CreditReportRequest` model

## Email Templates

The email system includes:

1. Professional HTML email templates with responsive design
2. Plain text fallback for email clients that don't support HTML
3. Personalized greeting with the user's name when available
4. Automatic attachment of the PDF credit report
5. Company branding and styling customization through environment variables

## Logs

Logs are stored in the `logs` directory:

- `rpa_report_generator.log`: Main RPA process logs
- `report_service.log`: Windows service logs
