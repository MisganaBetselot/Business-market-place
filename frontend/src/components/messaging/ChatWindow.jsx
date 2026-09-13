import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../common/Button";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ thread, currentUserId, onBack, onSend, sending }) {
  const [message, setMessage] = useState("");
  const bottomRef = useRef(null);

  const inquiry = thread?.inquiry;
  const messages = thread?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    onSend(message.trim());
    setMessage("");
  };

  if (!inquiry) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-soft">
        Select a conversation to view messages.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Listing context */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden rounded-full p-1 text-ink-soft hover:bg-surface-sunken hover:text-ink"
              aria-label="Back"
            >
              ←
            </button>
          )}
          <div className="flex-1 min-w-0">
            <Link
              to={`/business/${inquiry.listing}`}
              className="text-sm font-medium text-ink truncate hover:underline"
            >
              {inquiry.listing_name}
            </Link>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={String(msg.sender) === String(currentUserId)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-border px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
          />
          <Button type="submit" disabled={!message.trim() || sending}>
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </form>
    </div>
  );
}
