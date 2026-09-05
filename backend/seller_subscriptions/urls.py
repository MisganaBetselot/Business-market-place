from django.urls import path

from .views import (
    SellerSubscriptionAdminListView,
    SellerSubscriptionDetailView,
    SellerSubscriptionListCreateView,
)

urlpatterns = [
    path(
        "",
        SellerSubscriptionListCreateView.as_view(),
        name="seller-subscription-list-create",
    ),
    path(
        "admin/",
        SellerSubscriptionAdminListView.as_view(),
        name="seller-subscription-admin-list",
    ),
    path(
        "<int:pk>/",
        SellerSubscriptionDetailView.as_view(),
        name="seller-subscription-detail",
    ),
]