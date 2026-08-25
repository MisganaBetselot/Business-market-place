from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from .models import SellerSubscription
from .serializers import SellerSubscriptionSerializer


class SellerSubscriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = SellerSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            SellerSubscription.objects
            .filter(user=self.request.user)
            .select_related("plan")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        user = self.request.user
        plan = serializer.validated_data["plan"]

        existing_subscription = SellerSubscription.objects.filter(
            user=user,
            status__in=[
                SellerSubscription.Status.PENDING,
                SellerSubscription.Status.ACTIVE,
            ],
        ).exists()

        if existing_subscription:
            raise ValidationError(
                {
                    "detail": (
                        "You already have a pending or active subscription."
                    )
                }
            )

        serializer.save(
            user=user,
            status=SellerSubscription.Status.PENDING,
        )


class SellerSubscriptionDetailView(generics.RetrieveAPIView):
    serializer_class = SellerSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            SellerSubscription.objects
            .filter(user=self.request.user)
            .select_related("plan")
        )