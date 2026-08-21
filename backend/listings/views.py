from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import BusinessListing
from .serializers import BusinessListingSerializer


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