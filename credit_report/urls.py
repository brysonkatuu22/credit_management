# credit_report/urls.py
from django.urls import path
from .views import (
    generate_credit_report,
    download_credit_report,
    search_users,
    admin_generate_report,
    get_user_reports
)

urlpatterns = [
    path("report/request/", generate_credit_report, name="generate_report"),
    path("report/download/", download_credit_report, name="download_report"),
    path("reports/", get_user_reports, name="get_user_reports"),
    # Admin-specific endpoints
    path("admin/search-users/", search_users, name="search_users"),
    path("admin/generate-report/", admin_generate_report, name="admin_generate_report"),
]
