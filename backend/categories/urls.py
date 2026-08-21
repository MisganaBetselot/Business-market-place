from django.urls import path

from .views import BusinessCategoryListView


urlpatterns = [
    path(
        "",
        BusinessCategoryListView.as_view(),
        name="category-list",
    ),
]