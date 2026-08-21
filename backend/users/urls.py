from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import UserRegistrationView, UserMeView


urlpatterns = [
    path(
        "register/",
        UserRegistrationView.as_view(),
        name="user-register",
    ),
    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="user-login",
    ),
    path(
        "me/",
        UserMeView.as_view(),
        name="user-me",
    ),
]