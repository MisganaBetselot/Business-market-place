from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects
            .filter(user=self.request.user)
            .order_by("-created_at")
        )


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def _mark_as_read(self, request, pk):
        notification = get_object_or_404(
            Notification,
            pk=pk,
            user=request.user,
        )

        notification.is_read = True
        notification.save(update_fields=["is_read"])

        return Response(
            {
                "message": "Notification marked as read.",
                "notification_id": notification.id,
                "is_read": notification.is_read,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request, pk):
        return self._mark_as_read(request, pk)

    def patch(self, request, pk):
        return self._mark_as_read(request, pk)