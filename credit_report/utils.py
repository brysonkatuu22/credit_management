from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from django.utils.timezone import now
from loan.models import LoanAccount
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
        loan_accounts = LoanAccount.objects.filter(user=user)
        if loan_accounts.exists():
            elements.append(Paragraph("Loan Accounts", styles["Heading2"]))
            data = [
                ["#", "Account Number", "Lender", "Loan Amount", "Balance", "Interest (%)", "Start Date", "End Date", "Status"]
            ]
            for idx, loan in enumerate(loan_accounts, start=1):
                data.append([
                    idx,
                    loan.account_number,
                    loan.lender_name,
                    f"${loan.loan_amount}",
                    f"${loan.balance}",
                    f"{loan.interest_rate}%",
                    loan.start_date.strftime("%Y-%m-%d"),
                    loan.end_date.strftime("%Y-%m-%d"),
                    loan.status.capitalize()
                ])

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
