from django.conf import settings
from django.conf.urls.static import static
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
    path("api/subscriptions/", include("subscriptions.urls")),
    path("api/reports/", include("reports.urls")),
    path("api/audit-logs/", include("audit_logs.urls")),
]

# Dev-only: serve uploaded media files (photos etc.) directly through
# Django's dev server. Without this, file_path URLs returned by the API
# are correct but 404 when the browser actually requests them - files
# save to disk fine, they just were never wired up to be servable.
# Never rely on this in production; a real deployment serves media via
# nginx/S3/etc instead of Django's dev server.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)