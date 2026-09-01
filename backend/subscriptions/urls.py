from django.urls import path

from .views import SubscriptionPlanListView


urlpatterns = [
    path(
        "",
        SubscriptionPlanListView.as_view(),
        name="subscription-plan-list",
    ),
]
