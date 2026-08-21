from django.urls import path

from .views import (
    PaymentReceiptAdminListView,
    PaymentReceiptApproveView,
    PaymentReceiptListCreateView,
    PaymentReceiptRejectView,
)

urlpatterns = [
    path(
        "",
        PaymentReceiptListCreateView.as_view(),
        name="payment-list-create",
    ),
    path(
        "admin/",
        PaymentReceiptAdminListView.as_view(),
        name="payment-admin-list",
    ),
    path(
        "<int:pk>/approve/",
        PaymentReceiptApproveView.as_view(),
        name="payment-approve",
    ),
    path(
        "<int:pk>/reject/",
        PaymentReceiptRejectView.as_view(),
        name="payment-reject",
    ),
]