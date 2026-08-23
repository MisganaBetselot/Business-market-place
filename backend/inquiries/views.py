from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Inquiry
from .serializers import InquirySerializer


class InquiryListCreateView(generics.ListCreateAPIView):
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        return Inquiry.objects.filter(
            buyer=user
        ).union(
            Inquiry.objects.filter(seller=user)
        ).order_by("-created_at")

    def perform_create(self, serializer):
        listing = serializer.validated_data["listing"]

        if listing.seller == self.request.user:
            raise ValidationError(
                {"detail": "You cannot send an inquiry to your own listing."}
            )

        serializer.save(
            buyer=self.request.user,
            seller=listing.seller,
        )


class InquiryMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            inquiry = Inquiry.objects.get(pk=pk)
        except Inquiry.DoesNotExist:
            return Response(
                {"detail": "Inquiry not found."},
                status=404,
            )

        # Only the seller can mark the inquiry as read
        if inquiry.seller != request.user:
            return Response(
                {"detail": "Only the seller can mark this inquiry as read."},
                status=403,
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