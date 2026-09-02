export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.created_at).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
          isOwn
            ? "bg-brand-500 text-white rounded-br-sm"
            : "bg-surface-sunken text-ink rounded-bl-sm"
        }`}
      >
        <p className="text-sm leading-relaxed">{message.message}</p>
        <p className={`mt-1 text-xs ${isOwn ? "text-white/70" : "text-ink-soft"}`}>{time}</p>
      </div>
    </div>
  );
}
