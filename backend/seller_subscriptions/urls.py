
from django.urls import path

from .views import (
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
        "<int:pk>/",
        SellerSubscriptionDetailView.as_view(),
        name="seller-subscription-detail",
    ),
]