from django.urls import path

from .views import (
    ReportAdminListView,
    ReportListCreateView,
    ReportReviewView,
)

urlpatterns = [
    path(
        "",
        ReportListCreateView.as_view(),
        name="report-list-create",
    ),
    path(
        "admin/",
        ReportAdminListView.as_view(),
        name="report-admin-list",
    ),
    path(
        "<int:pk>/review/",
        ReportReviewView.as_view(),
        name="report-review",
    ),
]