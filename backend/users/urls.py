from django.urls import path

from .views import (
    UserRegistrationView,
    VerifyEmailOTPView,
    ResendVerificationOTPView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserMeView,
    VerifiedTokenObtainPairView,
)


urlpatterns = [
    # Authentication
    path("register/", UserRegistrationView.as_view(), name="register"),
    path("login/", VerifiedTokenObtainPairView.as_view(), name="login"),

    # Email verification
    path("verify-email/", VerifyEmailOTPView.as_view(), name="verify-email"),
    path("resend-verification/", ResendVerificationOTPView.as_view(), name="resend-verification"),

    # Password reset
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),

    # Current user
    path("me/", UserMeView.as_view(), name="me"),
]