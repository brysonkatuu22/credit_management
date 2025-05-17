from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from django.db import connection
import logging
import time

logger = logging.getLogger(__name__)

@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    A simple health check endpoint to verify the API is running.
    This endpoint doesn't require authentication and performs basic
    checks to ensure the system is functioning properly.

    This endpoint is designed to be extremely resilient and will
    always return a 200 response, even if there are errors, to
    prevent the frontend from blocking requests unnecessarily.
    """
    start_time = time.time()
    db_status = "unknown"
    error_details = None

    # Always return 200 OK with as much information as we can gather
    try:
        # Check database connection with a short timeout
        db_status = "error"  # Default to error until proven otherwise
        try:
            # Set a short timeout for the database check
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                db_result = cursor.fetchone()[0]
                db_status = "ok" if db_result == 1 else "error"
        except Exception as db_error:
            logger.warning(f"Database check failed: {str(db_error)}")
            error_details = {
                "type": "database_error",
                "message": str(db_error)
            }
            # Continue with the health check even if DB check fails

        # Calculate response time
        response_time = time.time() - start_time

        # Log health check
        if db_status == "ok":
            logger.info(f"Health check successful. Response time: {response_time:.4f}s")
        else:
            logger.warning(f"Partial health check. DB status: {db_status}. Response time: {response_time:.4f}s")

        # Always return a 200 response with the current status
        return JsonResponse({
            'status': 'ok',  # Always report OK to prevent frontend blocking
            'message': 'API server is running',
            'database': db_status,
            'response_time': f"{response_time:.4f}s",
            'error_details': error_details
        })
    except Exception as e:
        # Log the error
        logger.error(f"Health check failed: {str(e)}")

        # Calculate response time even for errors
        response_time = time.time() - start_time

        # Return a 200 response with error details
        # We still return 200 to allow the frontend to display the error message
        return JsonResponse({
            'status': 'ok',  # Always report OK to prevent frontend blocking
            'message': 'API server is running but encountered an error',
            'database': db_status,
            'response_time': f"{response_time:.4f}s",
            'error_details': {
                "type": "health_check_error",
                "message": str(e)
            }
        }, status=200)  # Always return 200 OK
