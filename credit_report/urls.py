# credit_report/urls.py
from django.urls import path
from .views import generate_credit_report, download_credit_report

urlpatterns = [
    path("report/request/", generate_credit_report, name="generate_report"),
    path("report/download/", download_credit_report, name="download_report"),
]
