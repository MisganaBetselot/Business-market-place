from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from listings.models import BusinessListing

from .models import Favorite
from .serializers import FavoriteSerializer


class FavoriteListCreateView(generics.ListCreateAPIView):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Favorite.objects
            .filter(user=self.request.user)
            .select_related("listing")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class FavoriteDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, listing_id):
        favorite = get_object_or_404(
            Favorite,
            user=request.user,
            listing_id=listing_id,
        )

        favorite.delete()

        return Response(
            {"message": "Listing removed from favorites."},
            status=status.HTTP_204_NO_CONTENT,
        )


class FavoriteToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, listing_id):
        listing = get_object_or_404(
            BusinessListing,
            pk=listing_id,
            status=BusinessListing.Status.ACTIVE,
        )

        favorite = Favorite.objects.filter(
            user=request.user,
            listing=listing,
        ).first()

        if favorite:
            favorite.delete()

            return Response(
                {
                    "favorited": False,
                    "message": "Listing removed from favorites.",
                }
            )

        favorite = Favorite.objects.create(
            user=request.user,
            listing=listing,
        )

        return Response(
            {
                "favorited": True,
                "favorite_id": favorite.id,
                "message": "Listing added to favorites.",
            },
            status=status.HTTP_201_CREATED,
        )