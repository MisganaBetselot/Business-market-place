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
            .select_related("plan", "listing")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        user = self.request.user
        listing = serializer.validated_data["listing"]

        existing_subscription = SellerSubscription.objects.filter(
            user=user,
            listing=listing,
            status__in=[
                SellerSubscription.Status.PENDING,
                SellerSubscription.Status.ACTIVE,
            ],
        ).exists()

        if existing_subscription:
            raise ValidationError(
                {"detail": "This listing already has a pending or active subscription."}
            )

        serializer.save(user=user, status=SellerSubscription.Status.PENDING)


class SellerSubscriptionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SellerSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    # No PUT (full replace) — only partial updates, and only ever used by
    # the frontend to swap {"plan": <id>} on a still-pending subscription.
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        return (
            SellerSubscription.objects
            .filter(user=self.request.user)
            .select_related("plan", "listing")
        )

    def perform_update(self, serializer):
        if serializer.instance.status != SellerSubscription.Status.PENDING:
            raise ValidationError(
                {"detail": "You can only change the plan while this subscription is still pending."}
            )
        serializer.save()