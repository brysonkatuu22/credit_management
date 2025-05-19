@echo off
echo Credit Loan Report RPA Automation
echo ================================

if "%1"=="" goto help

if "%1"=="schedule" (
    echo Starting scheduled report generation...
    python -m rpa_automation.cli schedule
    goto end
)

if "%1"=="all" (
    echo Generating reports for all users...
    python -m rpa_automation.cli generate all
    goto end
)

if "%1"=="due" (
    echo Generating reports for users with due loans...
    python -m rpa_automation.cli generate due
    goto end
)

if "%1"=="active" (
    echo Generating reports for users with active loans...
    python -m rpa_automation.cli generate active
    goto end
)

if "%1"=="email-active" (
    echo Generating reports for users with active loans and sending emails...
    python -m rpa_automation.cli generate active --email
    goto end
)

if "%1"=="email-all" (
    echo Generating reports for all users and sending emails...
    python -m rpa_automation.cli generate all --email
    goto end
)

if "%1"=="email-due" (
    echo Generating reports for users with due loans and sending emails...
    python -m rpa_automation.cli generate due --email
    goto end
)

if "%1"=="test-email" (
    if "%2"=="" (
        echo Error: Please provide a user email for testing
        echo Usage: generate_reports.bat test-email user@example.com
        goto end
    )
    echo Testing email report for %2...
    python test_email_report.py %2
    goto end
)

if "%1"=="install-service" (
    echo Installing Windows service...
    python -m rpa_automation.cli install-service
    goto end
)

:help
echo Usage: generate_reports.bat [command]
echo.
echo Commands:
echo   schedule         Run as a scheduled service
echo   all              Generate reports for all users
echo   due              Generate reports for users with due loans
echo   active           Generate reports for users with active loans
echo   email-all        Generate reports for all users and send emails
echo   email-due        Generate reports for users with due loans and send emails
echo   email-active     Generate reports for users with active loans and send emails
echo   test-email       Test email functionality for a specific user (requires email address)
echo   install-service  Install as a Windows service
echo.

:end
