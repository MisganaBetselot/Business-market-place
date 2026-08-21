from django.urls import path

from .views import (
    BusinessListingDetailView,
    BusinessListingListCreateView,
)


urlpatterns = [
    path(
        "",
        BusinessListingListCreateView.as_view(),
        name="listing-list-create",
    ),
    path(
        "<int:pk>/",
        BusinessListingDetailView.as_view(),
        name="listing-detail",
    ),
]