from django.urls import path

from .views import InquiryListCreateView, InquiryMarkReadView


urlpatterns = [
    path("", InquiryListCreateView.as_view(), name="inquiry-list-create"),
    path(
        "<int:pk>/read/",
        InquiryMarkReadView.as_view(),
        name="inquiry-mark-read",
    ),
]