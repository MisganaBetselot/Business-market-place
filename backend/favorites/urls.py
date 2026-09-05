from django.urls import path

from .views import (
    FavoriteDeleteView,
    FavoriteListCreateView,
    FavoriteToggleView,
)


urlpatterns = [
    path(
        "",
        FavoriteListCreateView.as_view(),
        name="favorite-list-create",
    ),

    path(
        "toggle/<int:listing_id>/",
        FavoriteToggleView.as_view(),
        name="favorite-toggle",
    ),

    path(
        "<int:listing_id>/",
        FavoriteDeleteView.as_view(),
        name="favorite-delete",
    ),
]