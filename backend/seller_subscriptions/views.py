from rest_framework import generics
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from users.permissions import IsAdminUser

from .models import SellerSubscription
from .serializers import SellerSubscriptionSerializer


class SellerSubscriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = SellerSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            SellerSubscription.objects
            .filter(user=self.request.user)
            .select_related("plan", "business")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        user = self.request.user
        plan = serializer.validated_data["plan"]
        business = serializer.validated_data.get("business")

        if not plan.is_active:
            raise ValidationError(
                {"plan": "This subscription plan is not active."}
            )

        if business is not None and business.seller_id != user.id:
            raise ValidationError(
                {"business": "You can only subscribe your own business."}
            )

        if business is not None:
            existing_subscription = SellerSubscription.objects.filter(
                business=business,
                status__in=[
                    SellerSubscription.Status.PENDING,
                    SellerSubscription.Status.ACTIVE,
                ],
            ).exists()

            if existing_subscription:
                raise ValidationError(
                    {
                        "business": (
                            "This business already has a pending or active "
                            "subscription."
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
            .select_related("plan", "business")
        )


class SellerSubscriptionAdminListView(generics.ListAPIView):
    serializer_class = SellerSubscriptionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        queryset = (
            SellerSubscription.objects
            .select_related(
                "user",
                "plan",
                "business",
            )
            .order_by("-created_at")
        )

        subscription_status = self.request.query_params.get("status")

        if subscription_status:
            queryset = queryset.filter(
                status=subscription_status
            )

        return queryset