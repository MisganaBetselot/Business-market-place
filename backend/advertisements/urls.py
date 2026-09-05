from django.urls import path

from .views import (
    AdvertisementAdminDetailView,
    AdvertisementAdminListCreateView,
    AdvertisementListCreateView,
    AdvertisementPaymentAdminListView,
    AdvertisementPaymentApproveView,
    AdvertisementPaymentListCreateView,
    AdvertisementPaymentRejectView,
    AdvertisementPlanAdminDetailView,
    AdvertisementPlanAdminListCreateView,
    PublicAdvertisementListView,
    PublicAdvertisementPlanListView,
)


urlpatterns = [
    # Public
    path(
        "",
        PublicAdvertisementListView.as_view(),
        name="advertisement-list",
    ),
    path(
        "plans/",
        PublicAdvertisementPlanListView.as_view(),
        name="advertisement-plan-list",
    ),

    # Advertiser
    path(
        "mine/",
        AdvertisementListCreateView.as_view(),
        name="advertisement-mine",
    ),
    path(
        "payments/",
        AdvertisementPaymentListCreateView.as_view(),
        name="advertisement-payment-list-create",
    ),

    # Admin advertisements
    path(
        "admin/",
        AdvertisementAdminListCreateView.as_view(),
        name="advertisement-admin-list-create",
    ),
    path(
        "admin/<int:pk>/",
        AdvertisementAdminDetailView.as_view(),
        name="advertisement-admin-detail",
    ),

    # Admin plans
    path(
        "admin/plans/",
        AdvertisementPlanAdminListCreateView.as_view(),
        name="advertisement-plan-admin-list-create",
    ),
    path(
        "admin/plans/<int:pk>/",
        AdvertisementPlanAdminDetailView.as_view(),
        name="advertisement-plan-admin-detail",
    ),

    # Admin payment review
    path(
        "admin/payments/",
        AdvertisementPaymentAdminListView.as_view(),
        name="advertisement-payment-admin-list",
    ),
    path(
        "admin/payments/<int:pk>/approve/",
        AdvertisementPaymentApproveView.as_view(),
        name="advertisement-payment-approve",
    ),
    path(
        "admin/payments/<int:pk>/reject/",
        AdvertisementPaymentRejectView.as_view(),
        name="advertisement-payment-reject",
    ),
]