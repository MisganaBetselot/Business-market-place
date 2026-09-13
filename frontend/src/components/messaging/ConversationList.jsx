function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function ConversationList({ conversations = [], activeId, currentUserId, onSelect }) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-display text-base font-semibold text-ink">Conversations</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-ink-soft">
            No messages yet.
          </div>
        ) : (
          conversations.map((conv) => {
            const isBuyer = String(conv.buyer) === String(currentUserId);
            const otherParty = isBuyer ? conv.seller_email : conv.buyer_email;
            const unread = (conv.unread_count ?? 0) > 0;

            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-muted ${
                  activeId === conv.id ? "bg-brand-50" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm truncate ${unread ? "font-semibold text-ink" : "font-medium text-ink"}`}>
                    {otherParty || "Unknown"}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-ink-soft">{timeAgo(conv.last_message_at)}</span>
                    {unread && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                  </div>
                </div>
                <span className="truncate text-xs text-ink-soft">{conv.last_message}</span>
                <span className="truncate text-xs text-ink-soft">{conv.listing_name}</span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
