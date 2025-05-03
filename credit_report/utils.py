from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from django.utils.timezone import now
from financial.models import LoanAccount as FinancialLoanAccount, CreditScoreHistory
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

        # Credit Score Section
        # Get the latest credit score for the user
        latest_credit_score = CreditScoreHistory.objects.filter(user=user).order_by('-calculation_date').first()

        if latest_credit_score:
            # Add Credit Score Section
            elements.append(Paragraph("Credit Score Analysis", styles["Heading2"]))
            elements.append(Spacer(1, 12))

            # Determine credit score category and color
            score = latest_credit_score.score
            if score >= 800:
                category = "Exceptional"
                color = colors.HexColor("#28a745")  # Green
                explanation = "Your credit score is exceptional. You qualify for the best interest rates and loan terms."
            elif score >= 740:
                category = "Excellent"
                color = colors.HexColor("#17a2b8")  # Blue
                explanation = "Your credit score is excellent. You qualify for very good interest rates and loan terms."
            elif score >= 670:
                category = "Good"
                color = colors.HexColor("#007bff")  # Primary blue
                explanation = "Your credit score is good. You qualify for good interest rates and loan terms."
            elif score >= 580:
                category = "Fair"
                color = colors.HexColor("#fd7e14")  # Orange
                explanation = "Your credit score is fair. You may qualify for loans but with higher interest rates."
            else:
                category = "Poor"
                color = colors.HexColor("#dc3545")  # Red
                explanation = "Your credit score is poor. You may have difficulty qualifying for loans or credit."

            # Create a table for the credit score display
            score_data = [
                ["Credit Score", "Category", "Last Updated"],
                [
                    str(score),
                    category,
                    latest_credit_score.calculation_date.strftime("%Y-%m-%d")
                ]
            ]

            score_table = Table(score_data, colWidths=[2*inch, 2*inch, 2*inch])
            score_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (0, 1), color),
                ('TEXTCOLOR', (0, 1), (0, 1), colors.white),
                ('FONTNAME', (0, 1), (0, 1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 1), (0, 1), 18),  # Larger font for score
                ('BACKGROUND', (1, 1), (1, 1), color),  # Same color for category
                ('TEXTCOLOR', (1, 1), (1, 1), colors.white),
                ('FONTNAME', (1, 1), (1, 1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertical alignment
                ('LEFTPADDING', (0, 0), (-1, -1), 6),    # Add padding
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),   # Add padding
                ('TOPPADDING', (0, 0), (-1, -1), 6),     # Add more padding
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),  # Add more padding
            ]))
            elements.append(score_table)
            elements.append(Spacer(1, 12))

            # Add score explanation
            elements.append(Paragraph(explanation, styles["Normal"]))
            elements.append(Spacer(1, 12))

            # Create a score range visualization
            elements.append(Paragraph("Credit Score Range", styles["Heading3"]))

            # Create a score range table
            range_data = [
                ["Poor", "Fair", "Good", "Excellent", "Exceptional"],
                ["300-579", "580-669", "670-739", "740-799", "800-850"]
            ]

            range_table = Table(range_data, colWidths=[1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch, 1.2*inch])
            range_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#dc3545")),  # Red
                ('BACKGROUND', (1, 0), (1, 0), colors.HexColor("#fd7e14")),  # Orange
                ('BACKGROUND', (2, 0), (2, 0), colors.HexColor("#007bff")),  # Blue
                ('BACKGROUND', (3, 0), (3, 0), colors.HexColor("#17a2b8")),  # Light Blue
                ('BACKGROUND', (4, 0), (4, 0), colors.HexColor("#28a745")),  # Green
                ('BACKGROUND', (0, 1), (0, 1), colors.HexColor("#ffcccb")),  # Light Red
                ('BACKGROUND', (1, 1), (1, 1), colors.HexColor("#ffe4b5")),  # Light Orange
                ('BACKGROUND', (2, 1), (2, 1), colors.HexColor("#add8e6")),  # Light Blue
                ('BACKGROUND', (3, 1), (3, 1), colors.HexColor("#b0e0e6")),  # Powder Blue
                ('BACKGROUND', (4, 1), (4, 1), colors.HexColor("#90ee90")),  # Light Green
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertical alignment
                ('LEFTPADDING', (0, 0), (-1, -1), 4),    # Add padding
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),   # Add padding
                ('TOPPADDING', (0, 0), (-1, -1), 4),     # Add padding
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),  # Add padding
            ]))
            elements.append(range_table)
            elements.append(Spacer(1, 12))

            # Add credit score factors
            elements.append(Paragraph("Key Factors Affecting Your Score", styles["Heading3"]))

            # Create factors based on the credit score data
            factors = []

            # Payment history (35% impact)
            if latest_credit_score.payment_history:
                payment_history = float(latest_credit_score.payment_history)
                if payment_history >= 0.95:
                    factors.append(("Excellent payment history", "Positive", "Your consistent on-time payments significantly boost your score."))
                elif payment_history >= 0.85:
                    factors.append(("Good payment history", "Positive", "Your payment history is good, with few late payments."))
                elif payment_history >= 0.75:
                    factors.append(("Fair payment history", "Neutral", "Some late payments are affecting your score."))
                else:
                    factors.append(("Poor payment history", "Negative", "Multiple late payments are significantly lowering your score."))

            # Credit utilization (30% impact)
            if latest_credit_score.credit_utilization:
                utilization = float(latest_credit_score.credit_utilization)
                if utilization <= 0.1:
                    factors.append(("Low credit utilization", "Positive", "Your low credit utilization ratio is excellent for your score."))
                elif utilization <= 0.3:
                    factors.append(("Good credit utilization", "Positive", "Your credit utilization is within the recommended range."))
                elif utilization <= 0.5:
                    factors.append(("Moderate credit utilization", "Neutral", "Your credit utilization is somewhat high."))
                else:
                    factors.append(("High credit utilization", "Negative", "Your high credit utilization is negatively impacting your score."))

            # Credit history length (15% impact)
            if latest_credit_score.credit_history_length:
                history_length = float(latest_credit_score.credit_history_length)
                if history_length >= 7:
                    factors.append(("Long credit history", "Positive", "Your long credit history positively impacts your score."))
                elif history_length >= 3:
                    factors.append(("Moderate credit history", "Neutral", "Your credit history length is average."))
                else:
                    factors.append(("Short credit history", "Negative", "Your short credit history is limiting your score."))

            # Credit mix (10% impact)
            if latest_credit_score.credit_mix:
                credit_mix = float(latest_credit_score.credit_mix)
                if credit_mix >= 0.7:
                    factors.append(("Diverse credit mix", "Positive", "Your diverse mix of credit types benefits your score."))
                elif credit_mix >= 0.4:
                    factors.append(("Average credit mix", "Neutral", "Your credit mix is average."))
                else:
                    factors.append(("Limited credit mix", "Negative", "Your limited variety of credit accounts affects your score."))

            # New credit (10% impact)
            if latest_credit_score.new_credit:
                new_credit = float(latest_credit_score.new_credit)
                if new_credit >= 0.7:
                    factors.append(("Few recent inquiries", "Positive", "You have few recent credit inquiries, which is good."))
                elif new_credit >= 0.4:
                    factors.append(("Some recent inquiries", "Neutral", "You have some recent credit inquiries."))
                else:
                    factors.append(("Many recent inquiries", "Negative", "Multiple recent credit inquiries are lowering your score."))

            # Public records
            if latest_credit_score.public_records is not None:
                if latest_credit_score.public_records == 0:
                    factors.append(("No public records", "Positive", "You have no negative public records."))
                else:
                    factors.append((f"{latest_credit_score.public_records} public records", "Negative", "Public records like bankruptcies significantly impact your score."))

            # Create a table for the factors
            if factors:
                factor_data = [["Factor", "Impact", "Description"]]
                for factor in factors:
                    factor_data.append(list(factor))

                # Adjust column widths to better fit content
                factor_table = Table(factor_data, colWidths=[1.8*inch, 1.2*inch, 3.5*inch])
                factor_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertical alignment
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),    # Add padding
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),   # Add padding
                    ('TOPPADDING', (0, 0), (-1, -1), 3),     # Add padding
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),  # Add padding
                    ('WORDWRAP', (0, 0), (-1, -1), True),    # Enable word wrapping
                ]))

                # Add color coding for impact
                for i, row in enumerate(factor_data[1:], 1):
                    impact = row[1]
                    if impact == "Positive":
                        factor_table.setStyle(TableStyle([
                            ('BACKGROUND', (1, i), (1, i), colors.HexColor("#28a745")),
                            ('TEXTCOLOR', (1, i), (1, i), colors.white),
                        ]))
                    elif impact == "Negative":
                        factor_table.setStyle(TableStyle([
                            ('BACKGROUND', (1, i), (1, i), colors.HexColor("#dc3545")),
                            ('TEXTCOLOR', (1, i), (1, i), colors.white),
                        ]))
                    else:  # Neutral
                        factor_table.setStyle(TableStyle([
                            ('BACKGROUND', (1, i), (1, i), colors.HexColor("#fd7e14")),
                            ('TEXTCOLOR', (1, i), (1, i), colors.white),
                        ]))

                elements.append(factor_table)
            else:
                elements.append(Paragraph("No specific factors available for your credit score.", styles["Normal"]))

            # Add score breakdown
            elements.append(Spacer(1, 12))
            elements.append(Paragraph("Credit Score Breakdown", styles["Heading3"]))

            # Create a table for the score breakdown
            breakdown_data = [
                ["Component", "Weight", "Your Score"],
                ["Payment History", "35%", f"{int(float(latest_credit_score.payment_history or 0) * 100)}%"],
                ["Credit Utilization", "30%", f"{int(float(latest_credit_score.credit_utilization or 0) * 100)}%"],
                ["Credit History Length", "15%", f"{float(latest_credit_score.credit_history_length or 0):.1f} years"],
                ["Credit Mix", "10%", f"{int(float(latest_credit_score.credit_mix or 0) * 100)}%"],
                ["New Credit", "10%", f"{int(float(latest_credit_score.new_credit or 0) * 100)}%"]
            ]

            breakdown_table = Table(breakdown_data, colWidths=[2.5*inch, 1.5*inch, 2.5*inch])
            breakdown_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertical alignment
                ('LEFTPADDING', (0, 0), (-1, -1), 6),    # Add padding
                ('RIGHTPADDING', (0, 0), (-1, -1), 6),   # Add padding
                ('TOPPADDING', (0, 0), (-1, -1), 3),     # Add padding
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),  # Add padding
            ]))
            elements.append(breakdown_table)

            # Add credit score history if available
            credit_history = CreditScoreHistory.objects.filter(user=user).order_by('-calculation_date')[:6]

            if credit_history.count() > 1:  # Only show history if there's more than one entry
                elements.append(Spacer(1, 12))
                elements.append(Paragraph("Credit Score History", styles["Heading3"]))

                # Create a table for the credit score history
                history_data = [["Date", "Score", "Change"]]

                prev_score = None
                for i, history in enumerate(reversed(list(credit_history))):
                    score = history.score
                    date = history.calculation_date.strftime("%Y-%m-%d")

                    if prev_score is not None:
                        change = score - prev_score
                        change_str = f"+{change}" if change > 0 else str(change)
                    else:
                        change_str = "N/A"

                    history_data.append([date, str(score), change_str])
                    prev_score = score

                history_table = Table(history_data, colWidths=[2*inch, 2*inch, 2*inch])
                history_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, -1), 9),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertical alignment
                    ('LEFTPADDING', (0, 0), (-1, -1), 6),    # Add padding
                    ('RIGHTPADDING', (0, 0), (-1, -1), 6),   # Add padding
                    ('TOPPADDING', (0, 0), (-1, -1), 3),     # Add padding
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),  # Add padding
                ]))

                # Add color coding for changes
                for i, row in enumerate(history_data[1:], 1):
                    change_str = row[2]
                    if change_str != "N/A":
                        if change_str.startswith("+"):
                            history_table.setStyle(TableStyle([
                                ('TEXTCOLOR', (2, i), (2, i), colors.HexColor("#28a745")),
                            ]))
                        elif change_str.startswith("-"):
                            history_table.setStyle(TableStyle([
                                ('TEXTCOLOR', (2, i), (2, i), colors.HexColor("#dc3545")),
                            ]))

                elements.append(history_table)

            elements.append(Spacer(1, 24))
        else:
            elements.append(Paragraph("No credit score information available.", styles["Normal"]))
            elements.append(Spacer(1, 12))

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

            # Set appropriate column widths for loan table
            col_widths = [0.3*inch, 1.2*inch, 1*inch, 1*inch, 1*inch, 0.8*inch, 1*inch, 1*inch, 0.8*inch]
            table = Table(data, repeatRows=1, colWidths=col_widths)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#003366")),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Vertical alignment
                ('LEFTPADDING', (0, 0), (-1, -1), 4),    # Add padding
                ('RIGHTPADDING', (0, 0), (-1, -1), 4),   # Add padding
                ('TOPPADDING', (0, 0), (-1, -1), 3),     # Add padding
                ('BOTTOMPADDING', (0, 0), (-1, -1), 3),  # Add padding
                ('WORDWRAP', (0, 0), (-1, -1), True),    # Enable word wrapping
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
