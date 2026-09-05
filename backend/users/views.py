from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailOTP
from .serializers import (
    UserRegistrationSerializer,
    create_and_send_otp,
)


User = get_user_model()


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(
            data=request.data
        )

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": (
                        "Registration successful. "
                        "Check your email for the verification code."
                    ),
                    "user": {
                        "id": str(user.id),
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "phone": user.phone,
                        "is_verified": user.is_verified,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class VerifyEmailOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response(
                {"error": "Email and OTP code are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid email or verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.is_verified:
            return Response(
                {"message": "Email is already verified."},
                status=status.HTTP_200_OK,
            )

        otp = (
            EmailOTP.objects
            .filter(
                user=user,
                purpose=EmailOTP.Purpose.SIGNUP,
                used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            return Response(
                {"error": "No valid verification code found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.expires_at < timezone.now():
            return Response(
                {"error": "Verification code has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.attempts >= 5:
            return Response(
                {"error": "Too many attempts. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.code != code:
            otp.attempts += 1
            otp.save(update_fields=["attempts"])

            return Response(
                {"error": "Invalid verification code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp.used = True
        otp.save(update_fields=["used"])

        user.is_verified = True
        user.is_active = True
        user.save(update_fields=["is_verified", "is_active"])

        return Response(
            {"message": "Email verified successfully."},
            status=status.HTTP_200_OK,
        )


class ResendVerificationOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "If the account exists, a new code has been sent."},
                status=status.HTTP_200_OK,
            )

        if user.is_verified:
            return Response(
                {"message": "Email is already verified."},
                status=status.HTTP_200_OK,
            )

        create_and_send_otp(
            user,
            EmailOTP.Purpose.SIGNUP,
        )

        return Response(
            {"message": "A new verification code has been sent."},
            status=status.HTTP_200_OK,
        )


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response(
                {"error": "Email is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {
                    "message": (
                        "If an account exists with this email, "
                        "a password reset code has been sent."
                    )
                },
                status=status.HTTP_200_OK,
            )

        create_and_send_otp(
            user,
            EmailOTP.Purpose.PASSWORD_RESET,
        )

        return Response(
            {
                "message": (
                    "If an account exists with this email, "
                    "a password reset code has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        code = request.data.get("code")
        new_password = request.data.get("new_password")

        if not email or not code or not new_password:
            return Response(
                {
                    "error": (
                        "Email, verification code, and "
                        "new password are required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "Invalid reset request."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        otp = (
            EmailOTP.objects
            .filter(
                user=user,
                purpose=EmailOTP.Purpose.PASSWORD_RESET,
                used=False,
            )
            .order_by("-created_at")
            .first()
        )

        if not otp:
            return Response(
                {"error": "No valid reset code found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.expires_at < timezone.now():
            return Response(
                {"error": "Reset code has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.attempts >= 5:
            return Response(
                {"error": "Too many attempts. Request a new code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if otp.code != code:
            otp.attempts += 1
            otp.save(update_fields=["attempts"])

            return Response(
                {"error": "Invalid reset code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user)
        except serializers.ValidationError as exc:
            return Response(
                {"new_password": exc.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])

        otp.used = True
        otp.save(update_fields=["used"])

        return Response(
            {"message": "Password reset successfully."},
            status=status.HTTP_200_OK,
        )


class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        return Response(
            {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "is_admin": user.is_admin,
                "is_verified": user.is_verified,
            }
        )
class VerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_verified:
            raise serializers.ValidationError(
                "Please verify your email before logging in."
            )

        return data


class VerifiedTokenObtainPairView(TokenObtainPairView):
    serializer_class = VerifiedTokenObtainPairSerializer