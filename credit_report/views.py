from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.utils.timezone import now
from django.contrib.auth import get_user_model
import os
import mimetypes
from .utils import generate_pdf_report
from .models import CreditReportRequest
from django.core.files.base import ContentFile
from rest_framework import serializers

User = get_user_model()

# Serializer for CreditReportRequest model
class CreditReportRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditReportRequest
        fields = ['id', 'created_at', 'report_file']


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_credit_report(request):
    user = request.user
    timestamp = now().strftime("%Y%m%d_%H%M%S")
    filename = f"Loan_Report_{timestamp}.pdf"

    # Ensure directory exists
    reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    file_path = os.path.join(reports_dir, filename)

    # Generate the PDF report
    try:
        generate_pdf_report(user, file_path)

        # Create a record in the CreditReportRequest model
        report_request = CreditReportRequest(user=user)

        # Save the file path to the model
        with open(file_path, 'rb') as f:
            report_request.report_file.save(filename, ContentFile(f.read()), save=True)

        # Save the record
        report_request.save()

    except Exception as e:
        return Response({
            "error": f"Failed to generate report: {str(e)}"
        }, status=500)

    return Response({
        "message": "Report generated successfully.",
        "report_url": f"{settings.MEDIA_URL}reports/{filename}"
    }, status=200)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_credit_report(request):
    user = request.user

    if not user.email:
        return Response({"error": "User has no email address."}, status=400)

    reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")

    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir, exist_ok=True)
        return Response({"error": "No reports have been generated yet."}, status=404)

    try:
        # Find all reports for this user
        reports = [f for f in os.listdir(reports_dir) if f.startswith(user.email)]
    except Exception as e:
        return Response({"error": f"Error accessing reports: {str(e)}"}, status=500)

    if not reports:
        return Response({"error": "No report found for this user."}, status=404)

    # Get the most recent report
    latest_report = sorted(reports)[-1]
    file_path = os.path.join(reports_dir, latest_report)

    if not os.path.exists(file_path):
        return Response({"error": "Report file not found."}, status=404)

    try:
        # Open the file in binary mode
        file = open(file_path, 'rb')

        # Set the content type
        content_type, _ = mimetypes.guess_type(file_path)
        if not content_type:
            content_type = 'application/pdf'

        # Create the response with proper headers
        response = FileResponse(
            file,
            content_type=content_type
        )

        # Set the content disposition header to force download
        response['Content-Disposition'] = f'attachment; filename="{latest_report}"'

        # Add cache control headers to prevent caching issues
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'

        return response

    except Exception as e:
        return Response({"error": f"Error serving file: {str(e)}"}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    """
    Search for users by email (partial match).
    Only accessible to admin users.
    """
    # Check if the user is an admin
    if not request.user.is_admin:
        return Response({"error": "You do not have permission to access this resource."},
                        status=status.HTTP_403_FORBIDDEN)

    # Get the search query from the request
    email_query = request.query_params.get('email', '')
    if not email_query:
        return Response({"error": "Email search parameter is required."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Search for users with matching email
    users = User.objects.filter(email__icontains=email_query)

    # Return the list of matching users
    user_data = [
        {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "date_joined": user.date_joined
        }
        for user in users
    ]

    return Response(user_data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_generate_report(request):
    """
    Generate a credit report for a specific user.
    Only accessible to admin users.
    """
    # Check if the user is an admin
    if not request.user.is_admin:
        return Response({"error": "You do not have permission to access this resource."},
                        status=status.HTTP_403_FORBIDDEN)

    # Get the user ID from the request
    user_email = request.data.get('user_email')
    if not user_email:
        return Response({"error": "User email is required."},
                        status=status.HTTP_400_BAD_REQUEST)

    # Find the user
    try:
        target_user = User.objects.get(email=user_email)
    except User.DoesNotExist:
        return Response({"error": f"User with email {user_email} not found."},
                        status=status.HTTP_404_NOT_FOUND)

    # Generate the report
    timestamp = now().strftime("%Y%m%d_%H%M%S")
    filename = f"{target_user.email}_Report_{timestamp}.pdf"

    # Ensure directory exists
    reports_dir = os.path.join(settings.MEDIA_ROOT, "reports")
    os.makedirs(reports_dir, exist_ok=True)

    file_path = os.path.join(reports_dir, filename)

    # Generate the PDF report
    try:
        generate_pdf_report(target_user, file_path)

        # Create a record in the CreditReportRequest model
        report_request = CreditReportRequest(user=target_user)

        # Save the file path to the model
        with open(file_path, 'rb') as f:
            report_request.report_file.save(filename, ContentFile(f.read()), save=True)

        # Save the record
        report_request.save()

    except Exception as e:
        return Response({
            "error": f"Failed to generate report: {str(e)}"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        "message": f"Report for {target_user.email} generated successfully.",
        "report_url": f"{settings.MEDIA_URL}reports/{filename}"
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_reports(request):
    """
    Get all credit reports for the current user.
    """
    # Get reports for the current user
    reports = CreditReportRequest.objects.filter(user=request.user).order_by('-created_at')

    # Serialize the reports
    serializer = CreditReportRequestSerializer(reports, many=True)

    return Response(serializer.data, status=status.HTTP_200_OK)