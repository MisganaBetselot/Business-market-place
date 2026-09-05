from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    path("admin/", admin.site.urls),

    path("api/users/", include("users.urls")),
    path("api/categories/", include("categories.urls")),
    path("api/listings/", include("listings.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/media/", include("media.urls")),
    path("api/inquiries/", include("inquiries.urls")),
    path("api/notifications/", include("notifications.urls")),
    path(
        "api/seller-subscriptions/",
        include("seller_subscriptions.urls"),
    ),
    path("api/reports/", include("reports.urls")),
    path("api/audit-logs/", include("audit_logs.urls")),
    path("api/favorites/", include("favorites.urls")),
path("api/advertisements/", include("advertisements.urls")),
path("api/subscriptions/", include("subscriptions.urls")),
]