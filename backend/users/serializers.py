import random
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import serializers

from .models import EmailOTP


User = get_user_model()


def generate_otp():
    return f"{random.randint(100000, 999999)}"


def create_and_send_otp(user, purpose):
    EmailOTP.objects.filter(
        user=user,
        purpose=purpose,
        used=False,
    ).update(used=True)

    code = generate_otp()

    otp = EmailOTP.objects.create(
        user=user,
        code=code,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(minutes=10),
    )

    subject = (
        "Business Marketplace - Email Verification"
        if purpose == EmailOTP.Purpose.SIGNUP
        else "Business Marketplace - Password Reset"
    )

    message = (
        f"Your verification code is: {code}\n\n"
        "This code expires in 10 minutes."
    )

    send_mail(
        subject,
        message,
        None,
        [user.email],
        fail_silently=False,
    )

    return otp


class UserRegistrationSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User
        fields = [
            "email",
            "password",
            "first_name",
            "last_name",
            "phone",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")

        user = User(
            **validated_data,
            is_verified=False,
            is_active=False,
        )

        user.set_password(password)
        user.save()

        create_and_send_otp(
            user,
            EmailOTP.Purpose.SIGNUP,
        )

        return user