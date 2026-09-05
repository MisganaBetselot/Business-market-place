from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer


class SubscriptionPlanListView(APIView):
    """
    Public endpoint for viewing active subscription plans.

    Used by the landing page and seller flow.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(
            is_active=True
        ).order_by("duration_days", "price")

        serializer = SubscriptionPlanSerializer(
            plans,
            many=True,
        )

        return Response(serializer.data)


class SubscriptionPlanDetailView(APIView):
    """
    Authenticated users can view an active plan.

    Admins can also view inactive plans.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        plan = get_object_or_404(
            SubscriptionPlan,
            pk=pk,
        )

        if not plan.is_active and not request.user.is_admin:
            return Response(
                {"detail": "Subscription plan not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = SubscriptionPlanSerializer(plan)

        return Response(serializer.data)


class SubscriptionPlanAdminListCreateView(APIView):
    """
    Admin-only endpoint for listing and creating subscription plans.
    """

    permission_classes = [IsAuthenticated]

    def check_admin(self, request):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return None

    def get(self, request):
        error = self.check_admin(request)

        if error:
            return error

        plans = SubscriptionPlan.objects.all().order_by(
            "duration_days",
            "price",
        )

        serializer = SubscriptionPlanSerializer(
            plans,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        error = self.check_admin(request)

        if error:
            return error

        serializer = SubscriptionPlanSerializer(
            data=request.data
        )

        if serializer.is_valid():
            plan = serializer.save()

            return Response(
                SubscriptionPlanSerializer(plan).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class SubscriptionPlanAdminDetailView(APIView):
    """
    Admin-only endpoint for updating or deleting subscription plans.
    """

    permission_classes = [IsAuthenticated]

    def check_admin(self, request):
        if not request.user.is_admin:
            return Response(
                {"detail": "Admin access required."},
                status=status.HTTP_403_FORBIDDEN,
            )

        return None

    def get_object(self, pk):
        return get_object_or_404(
            SubscriptionPlan,
            pk=pk,
        )

    def get(self, request, pk):
        error = self.check_admin(request)

        if error:
            return error

        plan = self.get_object(pk)

        serializer = SubscriptionPlanSerializer(plan)

        return Response(serializer.data)

    def put(self, request, pk):
        error = self.check_admin(request)

        if error:
            return error

        plan = self.get_object(pk)

        serializer = SubscriptionPlanSerializer(
            plan,
            data=request.data,
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):
        error = self.check_admin(request)

        if error:
            return error

        plan = self.get_object(pk)

        serializer = SubscriptionPlanSerializer(
            plan,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        error = self.check_admin(request)

        if error:
            return error

        plan = self.get_object(pk)

        plan.is_active = False
        plan.save(update_fields=["is_active"])

        return Response(
            {
                "message": "Subscription plan deactivated successfully."
            },
            status=status.HTTP_200_OK,
        )