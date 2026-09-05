from django.urls import path

from .views import (
    MediaAdminListView,
    MediaApproveView,
    MediaListCreateView,
    MediaRejectView,
    MediaStartReviewView,
)

urlpatterns = [
    path(
        "",
        MediaListCreateView.as_view(),
        name="media-list-create",
    ),
    path(
        "admin/",
        MediaAdminListView.as_view(),
        name="media-admin-list",
    ),
    path(
        "<int:pk>/review/",
        MediaStartReviewView.as_view(),
        name="media-start-review",
    ),
    path(
        "<int:pk>/approve/",
        MediaApproveView.as_view(),
        name="media-approve",
    ),
    path(
        "<int:pk>/reject/",
        MediaRejectView.as_view(),
        name="media-reject",
    ),
]