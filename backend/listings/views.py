from django.db.models import Prefetch
from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from media.models import Media

from .models import BusinessListing
from .serializers import BusinessListingSerializer


class BusinessListingListCreateView(generics.ListCreateAPIView):
    serializer_class = BusinessListingSerializer

    def get_queryset(self):
        queryset = (
            BusinessListing.objects
            .select_related("seller", "category")
            .prefetch_related(
                Prefetch(
                    "media",
                    queryset=Media.objects.filter(
                        status=Media.Status.APPROVED
                    ).select_related("subscription__plan"),
                    to_attr="approved_media",
                )
            )
            .order_by("-created_at")
        )

        if self.request.method == "GET":
            queryset = queryset.filter(
                status=BusinessListing.Status.ACTIVE
            )

            search = self.request.query_params.get("search")
            category = self.request.query_params.get("category")
            region = self.request.query_params.get("region")
            city = self.request.query_params.get("city")
            ordering = self.request.query_params.get("ordering")

            if search:
                queryset = queryset.filter(
                    business_name__icontains=search
                )

            if category:
                queryset = queryset.filter(category_id=category)

            if region:
                queryset = queryset.filter(
                    region__icontains=region
                )

            if city:
                queryset = queryset.filter(
                    city__icontains=city
                )

            allowed_ordering = {
                "price": "asking_price",
                "-price": "-asking_price",
                "name": "business_name",
                "-name": "-business_name",
                "newest": "-created_at",
                "oldest": "created_at",
            }

            if ordering in allowed_ordering:
                queryset = queryset.order_by(
                    allowed_ordering[ordering]
                )

        return queryset

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)


class BusinessListingDetailView(generics.RetrieveAPIView):
    serializer_class = BusinessListingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return (
            BusinessListing.objects
            .filter(status=BusinessListing.Status.ACTIVE)
            .select_related("seller", "category")
            .prefetch_related(
                Prefetch(
                    "media",
                    queryset=Media.objects.filter(
                        status=Media.Status.APPROVED
                    ).select_related("subscription__plan"),
                    to_attr="approved_media",
                )
            )
        )