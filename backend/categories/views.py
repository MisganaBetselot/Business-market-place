from rest_framework import generics
from rest_framework.permissions import AllowAny

from .models import BusinessCategory
from .serializers import BusinessCategorySerializer


class BusinessCategoryListView(generics.ListAPIView):
    queryset = BusinessCategory.objects.all().order_by("name")
    serializer_class = BusinessCategorySerializer
    permission_classes = [AllowAny]