from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Notification

from .models import Inquiry
from .serializers import InquirySerializer


class InquiryListCreateView(generics.ListCreateAPIView):
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return (
            Inquiry.objects
            .filter(Q(buyer=user) | Q(seller=user))
            .select_related("listing", "buyer", "seller")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        listing = serializer.validated_data["listing"]

        if listing.status != "ACTIVE":
            raise ValidationError(
                {"listing": "You can only send inquiries about active listings."}
            )

        if listing.seller_id == self.request.user.id:
            raise ValidationError(
                {"listing": "You cannot send an inquiry to your own listing."}
            )

        inquiry = serializer.save(
            buyer=self.request.user,
            seller=listing.seller,
        )

        Notification.objects.create(
            user=listing.seller,
            type=Notification.NotificationType.NEW_INQUIRY,
            message=(
                f"You have received a new inquiry about "
                f"{listing.business_name}."
            ),
        )


class InquiryMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            inquiry = Inquiry.objects.get(pk=pk)
        except Inquiry.DoesNotExist:
            return Response(
                {"detail": "Inquiry not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if inquiry.seller_id != request.user.id:
            return Response(
                {"detail": "Only the seller can mark this inquiry as read."},
                status=status.HTTP_403_FORBIDDEN,
            )

        inquiry.is_read = True
        inquiry.save(update_fields=["is_read", "updated_at"])

        return Response(
            {
                "message": "Inquiry marked as read.",
                "inquiry_id": inquiry.id,
                "is_read": inquiry.is_read,
            }
        )