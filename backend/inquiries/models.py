from django.conf import settings
from django.db import models


class Inquiry(models.Model):
    id = models.BigAutoField(primary_key=True)

    listing = models.ForeignKey(
        "listings.BusinessListing",
        on_delete=models.CASCADE,
        related_name="inquiries",
    )

    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_inquiries",
    )

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_inquiries",
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Inquiry #{self.id} - {self.listing.business_name}"


class InquiryMessage(models.Model):
    """A single message in an inquiry thread, sent by either the buyer or
    the seller after the inquiry was opened. The inquiry's own `message`
    field remains the first message in the thread; every reply after that
    (from either side) is stored here."""

    id = models.BigAutoField(primary_key=True)

    inquiry = models.ForeignKey(
        Inquiry,
        on_delete=models.CASCADE,
        related_name="thread_messages",
    )

    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_inquiry_messages",
    )

    message = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Message #{self.id} on Inquiry #{self.inquiry_id}"