from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import BusinessListing
from .serializers import BusinessListingSerializer
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
    queryset = BusinessListing.objects.all().order_by("-created_at")
    serializer_class = BusinessListingSerializer

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class BusinessListingDetailView(generics.RetrieveAPIView):
    queryset = BusinessListing.objects.all()
    serializer_class = BusinessListingSerializer
    permission_classes = [AllowAny]