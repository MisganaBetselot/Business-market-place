from django.urls import path

from .views import (
    InquiryListCreateView,
    InquiryMarkReadView,
    InquiryMessageListCreateView,
)


urlpatterns = [
    path("", InquiryListCreateView.as_view(), name="inquiry-list-create"),
    path(
        "<int:pk>/read/",
        InquiryMarkReadView.as_view(),
        name="inquiry-mark-read",
    ),
    path(
        "<int:pk>/messages/",
        InquiryMessageListCreateView.as_view(),
        name="inquiry-messages",
    ),
]