from django.urls import path

from .views import (
    SubscriptionPlanListView,
    SubscriptionPlanDetailView,
    SubscriptionPlanAdminListCreateView,
    SubscriptionPlanAdminDetailView,
)


urlpatterns = [
    path(
        "",
        SubscriptionPlanListView.as_view(),
        name="subscription-plan-list",
    ),
    path(
        "<int:pk>/",
        SubscriptionPlanDetailView.as_view(),
        name="subscription-plan-detail",
    ),
    path(
        "admin/",
        SubscriptionPlanAdminListCreateView.as_view(),
        name="subscription-plan-admin-list-create",
    ),
    path(
        "admin/<int:pk>/",
        SubscriptionPlanAdminDetailView.as_view(),
        name="subscription-plan-admin-detail",
    ),
]