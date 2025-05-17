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
echo   email-active     Generate reports for users with active loans and send emails
echo   install-service  Install as a Windows service
echo.

:end
