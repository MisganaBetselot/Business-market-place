from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer


class SubscriptionPlanListView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.filter(is_active=True).order_by("price")
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]
