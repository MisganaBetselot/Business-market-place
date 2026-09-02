export default function ConversationList({ conversations = [], activeId, onSelect }) {
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
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors hover:bg-surface-muted ${
                activeId === conv.id ? "bg-brand-50" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink truncate">{conv.sellerName}</span>
                {conv.unread && <span className="h-2 w-2 rounded-full bg-brand-500 shrink-0 ml-2" />}
              </div>
              <span className="truncate text-xs text-ink-soft">{conv.lastMessage}</span>
              <span className="truncate text-xs text-ink-soft">{conv.listingTitle}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
