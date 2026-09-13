from rest_framework import serializers

from .models import Inquiry, InquiryMessage


class InquiryMessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.EmailField(
        source="sender.email",
        read_only=True,
    )

    class Meta:
        model = InquiryMessage
        fields = [
            "id",
            "inquiry",
            "sender",
            "sender_email",
            "message",
            "is_read",
            "created_at",
        ]
        read_only_fields = ["inquiry", "sender", "is_read", "created_at"]


class InquirySerializer(serializers.ModelSerializer):
    buyer_email = serializers.EmailField(
        source="buyer.email",
        read_only=True,
    )

    seller_email = serializers.EmailField(
        source="seller.email",
        read_only=True,
    )

    listing_name = serializers.CharField(
        source="listing.business_name",
        read_only=True,
    )

    last_message = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Inquiry
        fields = [
            "id",
            "listing",
            "listing_name",
            "buyer",
            "buyer_email",
            "seller",
            "seller_email",
            "message",
            "is_read",
            "created_at",
            "updated_at",
            "last_message",
            "last_message_at",
            "message_count",
            "unread_count",
        ]

        read_only_fields = [
            "buyer",
            "seller",
            "is_read",
            "created_at",
            "updated_at",
        ]

    def _last_thread_message(self, obj):
        return obj.thread_messages.order_by("-created_at").first()

    def get_last_message(self, obj):
        last = self._last_thread_message(obj)
        return last.message if last else obj.message

    def get_last_message_at(self, obj):
        last = self._last_thread_message(obj)
        return (last.created_at if last else obj.created_at)

    def get_message_count(self, obj):
        return obj.thread_messages.count() + 1  # +1 for the opening message

    def get_unread_count(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return 0
        user = request.user
        count = obj.thread_messages.filter(is_read=False).exclude(sender=user).count()
        # the opening inquiry message itself counts as unread until the
        # inquiry-level is_read flag is set, but only for the seller side
        if obj.seller_id == user.id and not obj.is_read:
            count += 1
        return count