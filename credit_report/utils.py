from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from django.utils.timezone import now
from financial.models import LoanAccount as FinancialLoanAccount
from loan.models import LoanAccount as LoanLoanAccount
import os


def generate_pdf_report(user, file_path):
    try:
        doc = SimpleDocTemplate(file_path, pagesize=A4)
        styles = getSampleStyleSheet()
        elements = []

        # Add custom title with WordArt-style effect
        title_style = styles["Title"]
        title_style.fontName = "Helvetica-Bold"
        title_style.fontSize = 24
        elements.append(Spacer(1, 20))

        # Add "Fintrack Solutions" at the top in dark blue (#003366)
        header = Paragraph('<font color="#003366"><b>Fintrack Solutions: Digitalizing credit loan management.</b></font>', title_style)
        elements.append(header)
        elements.append(Spacer(1, 20))  # Space after the header

        # Title for Credit Report
        title = Paragraph("Credit Report", styles["Title"])
        elements.append(title)
        elements.append(Spacer(1, 12))

        # User info
        date_generated = now().strftime("%Y-%m-%d %H:%M:%S")
        user_info = f"""
            <b>Email:</b> {user.email}<br/>
            <b>Joined on:</b> {user.date_joined.strftime('%Y-%m-%d')}<br/>
            <b>Report Generated:</b> {date_generated}
        """
        elements.append(Paragraph(user_info, styles["Normal"]))
        elements.append(Spacer(1, 24))

        # Loan accounts section
        # Get loans from both models
        financial_loans = FinancialLoanAccount.objects.filter(user=user)
        loan_loans = LoanLoanAccount.objects.filter(user=user)

        # Check if any loans exist
        has_loans = financial_loans.exists() or loan_loans.exists()

        if has_loans:
            elements.append(Paragraph("Loan Accounts", styles["Heading2"]))
            data = [
                ["#", "Lender", "Loan Type", "Amount", "Balance", "Interest (%)", "Start Date", "End Date", "Status"]
            ]

            # Add loans from financial app
            idx = 1
            for loan in financial_loans:
                # Convert remaining_balance to balance for consistency
                balance = loan.remaining_balance
                # Convert is_active to status for consistency
                status = "Active" if loan.is_active else "Closed"

                data.append([
                    idx,
                    loan.lender,
                    loan.get_loan_type_display(),
                    f"Ksh {loan.principal_amount}",
                    f"Ksh {balance}",
                    f"{loan.interest_rate}%",
                    loan.start_date.strftime("%Y-%m-%d"),
                    loan.end_date.strftime("%Y-%m-%d"),
                    status
                ])
                idx += 1

            # Add loans from loan app
            for loan in loan_loans:
                data.append([
                    idx,
                    loan.lender_name,
                    "Loan",  # Default type since loan app doesn't have types
                    f"Ksh {loan.loan_amount}",
                    f"Ksh {loan.balance}",
                    f"{loan.interest_rate}%",
                    loan.start_date.strftime("%Y-%m-%d"),
                    loan.end_date.strftime("%Y-%m-%d"),
                    loan.status.capitalize()
                ])
                idx += 1

            table = Table(data, repeatRows=1)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            elements.append(table)
        else:
            elements.append(Paragraph("No loan accounts found.", styles["Normal"]))

        elements.append(Spacer(1, 36))
        footer = Paragraph("<i>This is a system-generated credit report.</i>", styles["Normal"])
        elements.append(footer)

        doc.build(elements)
    except Exception as e:
        print(f"Error generating PDF: {e}")
        raise  # Reraise the exception
