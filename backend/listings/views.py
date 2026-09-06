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
        # FIX: previously returned every listing regardless of status,
        # meaning DRAFT/SUSPENDED listings were publicly visible to
        # anyone browsing - a real privacy issue (confirmed in the
        # integration report). Visibility now depends on who's asking:
        user = self.request.user if self.request.user.is_authenticated else None

        # Admins see everything, including other sellers' drafts - needed
        # for moderation.
        if user and getattr(user, "is_admin", False):
            return BusinessListing.objects.all().order_by("-created_at")

        # A logged-in seller viewing their own listings (e.g. "My
        # Listings" page) sees all of their own, any status - explicit
        # opt-in via ?mine=true so this endpoint doesn't silently change
        # behavior for a seller just browsing the public marketplace.
        if user and self.request.query_params.get("mine") == "true":
            return BusinessListing.objects.filter(seller=user).order_by("-created_at")

        # Everyone else (anonymous buyers, or a seller not asking for
        # their own listings) only ever sees published listings.
        return BusinessListing.objects.filter(
            status=BusinessListing.Status.ACTIVE
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class BusinessListingDetailView(generics.RetrieveAPIView):
    serializer_class = BusinessListingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        # Unfiltered on purpose - visibility is enforced in get_object
        # below, where we can distinguish "not found" from "not yours to
        # see" and always respond 404 either way (never reveal that a
        # private draft exists at this URL via a 403 instead of a 404).
        return BusinessListing.objects.all()

    def get_object(self):
        listing = super().get_object()
        user = self.request.user if self.request.user.is_authenticated else None

        if listing.status == BusinessListing.Status.ACTIVE:
            return listing

        if user and (user == listing.seller or getattr(user, "is_admin", False)):
            return listing

        raise Http404