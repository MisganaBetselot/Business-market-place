from django.db.models import Sum
from django.http import Http404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BusinessListing, SavedListing
from .serializers import BusinessListingSerializer


class SavedListingListView(generics.ListAPIView):
    serializer_class = BusinessListingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BusinessListing.objects.filter(
            saved_by__user=self.request.user
        ).order_by("-saved_by__created_at")


class SaveListingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            listing = BusinessListing.objects.get(pk=pk)
        except BusinessListing.DoesNotExist:
            return Response(
                {"detail": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        SavedListing.objects.get_or_create(
            user=request.user,
            listing=listing,
        )

        return Response(
            {"detail": "Listing saved."},
            status=status.HTTP_201_CREATED,
        )

    def delete(self, request, pk):
        try:
            listing = BusinessListing.objects.get(pk=pk)
        except BusinessListing.DoesNotExist:
            return Response(
                {"detail": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        deleted, _ = SavedListing.objects.filter(
            user=request.user,
            listing=listing,
        ).delete()

        if deleted == 0:
            return Response(
                {"detail": "Listing was not saved."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class BusinessListingListCreateView(generics.ListCreateAPIView):
    serializer_class = BusinessListingSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user if self.request.user.is_authenticated else None

        if user and getattr(user, "is_admin", False):
            return BusinessListing.objects.all().order_by("-created_at")

        if user and self.request.query_params.get("mine") == "true":
            return BusinessListing.objects.filter(seller=user).order_by("-created_at")

        return BusinessListing.objects.filter(
            status=BusinessListing.Status.ACTIVE
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class BusinessListingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BusinessListingSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.request.method in ("GET", "HEAD", "OPTIONS"):
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return BusinessListing.objects.all()

    def get_object(self):
        listing = super().get_object()
        user = self.request.user if self.request.user.is_authenticated else None

        if listing.status == BusinessListing.Status.ACTIVE:
            return listing

        if user and (user == listing.seller or getattr(user, "is_admin", False)):
            return listing

        raise Http404

    def perform_update(self, serializer):
        listing = serializer.instance
        user = self.request.user
        if not (user == listing.seller or getattr(user, "is_admin", False)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the seller or an admin can update this listing.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not (user == instance.seller or getattr(user, "is_admin", False)):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the seller or an admin can delete this listing.")
        instance.delete()


class RecordViewView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            listing = BusinessListing.objects.get(pk=pk)
        except BusinessListing.DoesNotExist:
            return Response(
                {"detail": "Listing not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user if request.user.is_authenticated else None
        if user and user == listing.seller:
            return Response(
                {"detail": "Sellers cannot record views for their own listings."},
                status=status.HTTP_403_FORBIDDEN,
            )

        listing.views = (listing.views or 0) + 1
        listing.save(update_fields=["views"])
        return Response({"views": listing.views}, status=status.HTTP_200_OK)


class SellerOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        listings = BusinessListing.objects.filter(seller=user)
        listing_counts = {
            "draft": listings.filter(status=BusinessListing.Status.DRAFT).count(),
            "active": listings.filter(status=BusinessListing.Status.ACTIVE).count(),
            "sold": listings.filter(status=BusinessListing.Status.SOLD).count(),
            "suspended": listings.filter(status=BusinessListing.Status.SUSPENDED).count(),
        }

        total_views = listings.aggregate(total=Sum("views"))["total"] or 0
        saved_businesses_count = SavedListing.objects.filter(user=user).count()

        unread_inquiries = 0
        try:
            from inquiries.models import Inquiry
            unread_inquiries = Inquiry.objects.filter(seller=user, is_read=False).count()
        except Exception:
            pass

        unread_notifications = 0
        try:
            from notifications.models import Notification
            unread_notifications = Notification.objects.filter(user=user, is_read=False).count()
        except Exception:
            pass

        subscription = None
        days_remaining = None
        from seller_subscriptions.models import SellerSubscription
        sub_qs = SellerSubscription.objects.filter(user=user).select_related("plan", "listing").order_by("-created_at")
        active_sub = sub_qs.filter(status=SellerSubscription.Status.ACTIVE).first()
        if active_sub is None and sub_qs.exists():
            active_sub = sub_qs.first()

        if active_sub:
            subscription = {
                "status": active_sub.status,
                "expiry_date": active_sub.expiry_date.isoformat() if active_sub.expiry_date else None,
            }
            if active_sub.expiry_date:
                from django.utils import timezone as dj_tz
                now = dj_tz.now()
                expiry = active_sub.expiry_date
                if expiry.tzinfo is None:
                    expiry = dj_tz.make_aware(expiry)
                diff = (expiry - now).total_seconds() / 86400
                days_remaining = max(int(diff), 0)

        return Response({
            "listing_counts": listing_counts,
            "total_views": total_views,
            "saved_businesses_count": saved_businesses_count,
            "unread_inquiries": unread_inquiries,
            "unread_notifications": unread_notifications,
            "subscription": subscription,
            "days_remaining": days_remaining,
        })