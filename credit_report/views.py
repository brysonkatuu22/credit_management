from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from django.http import FileResponse, HttpResponse
from django.utils.timezone import now
import os
import mimetypes
from .utils import generate_pdf_report


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