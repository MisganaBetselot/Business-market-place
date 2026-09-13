from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError, PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Inquiry, InquiryMessage
from .serializers import InquirySerializer, InquiryMessageSerializer
from notifications.models import Notification


class InquiryListCreateView(generics.ListCreateAPIView):
    serializer_class = InquirySerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["request"] = self.request
        return context

    def get_queryset(self):
        user = self.request.user
        role = self.request.query_params.get("role")

        qs = Inquiry.objects.all()

        if role == "seller":
            qs = qs.filter(seller=user)
        elif role == "buyer":
            qs = qs.filter(buyer=user)
        else:
            qs = qs.filter(buyer=user).union(qs.filter(seller=user))

        return qs.order_by("-created_at")

    def create(self, request, *args, **kwargs):
        listing_id = request.data.get("listing")
        message_text = (request.data.get("message") or "").strip()

        if not message_text:
            raise ValidationError({"message": "This field is required."})

        from listings.models import BusinessListing
        try:
            listing = BusinessListing.objects.get(pk=listing_id)
        except (BusinessListing.DoesNotExist, ValueError, TypeError):
            raise ValidationError({"listing": "Listing not found."})

        if listing.seller_id == request.user.id:
            raise ValidationError(
                {"detail": "You cannot send an inquiry to your own listing."}
            )

        # Continue an existing conversation instead of spawning a duplicate
        # thread every time the same buyer messages about the same listing.
        existing = Inquiry.objects.filter(
            listing=listing, buyer=request.user
        ).first()

        if existing:
            InquiryMessage.objects.create(
                inquiry=existing, sender=request.user, message=message_text
            )
            existing.is_read = False
            existing.save(update_fields=["is_read", "updated_at"])

            Notification.objects.create(
                user=existing.seller,
                type=Notification.NotificationType.NEW_MESSAGE,
                message=f"New message about {listing.business_name}.",
            )

            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=201)

        inquiry = Inquiry.objects.create(
            listing=listing,
            buyer=request.user,
            seller=listing.seller,
            message=message_text,
        )

        Notification.objects.create(
            user=listing.seller,
            type=Notification.NotificationType.NEW_INQUIRY,
            message=(
                f"You have received a new inquiry about "
                f"{listing.business_name}."
            ),
        )

        serializer = self.get_serializer(inquiry)
        return Response(serializer.data, status=201)


class InquiryMessageListCreateView(generics.ListCreateAPIView):
    """Full thread for one inquiry: the opening message plus every reply,
    in order. Available to either the buyer or the seller on that inquiry."""

    serializer_class = InquiryMessageSerializer
    permission_classes = [IsAuthenticated]

    def _get_inquiry(self):
        try:
            inquiry = Inquiry.objects.get(pk=self.kwargs["pk"])
        except Inquiry.DoesNotExist:
            raise ValidationError({"detail": "Inquiry not found."})

        user = self.request.user
        if user.id not in (inquiry.buyer_id, inquiry.seller_id):
            raise PermissionDenied(
                "You are not a participant in this conversation."
            )
        return inquiry

    def list(self, request, *args, **kwargs):
        inquiry = self._get_inquiry()

        # Mark everything sent by the other party as read now that this
        # participant has opened the thread.
        inquiry.thread_messages.exclude(sender=request.user).update(is_read=True)
        if inquiry.seller_id == request.user.id:
            inquiry.is_read = True
            inquiry.save(update_fields=["is_read", "updated_at"])

        replies = InquiryMessageSerializer(
            inquiry.thread_messages.all(), many=True
        ).data

        opening_message = {
            "id": f"opening-{inquiry.id}",
            "inquiry": inquiry.id,
            "sender": inquiry.buyer_id,
            "sender_email": inquiry.buyer.email,
            "message": inquiry.message,
            "is_read": True,
            "created_at": inquiry.created_at,
        }

        return Response({
            "inquiry": InquirySerializer(inquiry, context={"request": request}).data,
            "messages": [opening_message, *replies],
        })

    def create(self, request, *args, **kwargs):
        inquiry = self._get_inquiry()
        message_text = (request.data.get("message") or "").strip()

        if not message_text:
            raise ValidationError({"message": "This field is required."})

        reply = InquiryMessage.objects.create(
            inquiry=inquiry, sender=request.user, message=message_text
        )

        recipient_id = (
            inquiry.buyer_id
            if request.user.id == inquiry.seller_id
            else inquiry.seller_id
        )
        Notification.objects.create(
            user_id=recipient_id,
            type=Notification.NotificationType.NEW_MESSAGE,
            message=f"New message about {inquiry.listing.business_name}.",
        )

        return Response(InquiryMessageSerializer(reply).data, status=201)


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

        if inquiry.seller != request.user:
            return Response(
                {"detail": "Only the seller can mark this inquiry as read."},
                status=403,
            )

        inquiry.is_read = True
        inquiry.save(update_fields=["is_read", "updated_at"])
        inquiry.thread_messages.exclude(sender=request.user).update(is_read=True)

        return Response(
            {
                "message": "Inquiry marked as read.",
                "inquiry_id": inquiry.id,
                "is_read": inquiry.is_read,
            }
        )