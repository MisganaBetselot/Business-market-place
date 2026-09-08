from django.urls import path

from .views import (
    BusinessListingDetailView,
    BusinessListingListCreateView,
    SavedListingListView,
    SaveListingView,
    RecordViewView,
)


urlpatterns = [
    path(
        "",
        BusinessListingListCreateView.as_view(),
        name="listing-list-create",
    ),

    path(
        "saved/",
        SavedListingListView.as_view(),
        name="saved-listings",
    ),

    path(
        "<int:pk>/save/",
        SaveListingView.as_view(),
        name="save-listing",
    ),

    path(
        "<int:pk>/",
        BusinessListingDetailView.as_view(),
        name="listing-detail",
    ),

    path(
        "<int:pk>/view/",
        RecordViewView.as_view(),
        name="listing-record-view",
    ),
]
