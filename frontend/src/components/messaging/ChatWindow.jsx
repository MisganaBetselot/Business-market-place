import { useState } from "react";
import Button from "../common/Button";

export default function ChatWindow({ conversation, onBack, onSend }) {
  const [message, setMessage] = useState("");

  const handleSend = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    onSend(conversation.id, message.trim());
    setMessage("");
  };

  return (
    <div className="flex h-full flex-col">
      {/* Listing Preview */}
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
          <img
            src={conversation.listingImage}
            alt={conversation.listingTitle}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-ink truncate">{conversation.listingTitle}</h3>
            <p className="text-xs text-ink-soft">
              {conversation.listingPrice?.toLocaleString?.() ?? conversation.listingPrice} ETB
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          {conversation.messages?.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "buyer" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-4 py-2.5 ${
                  msg.sender === "buyer"
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : "bg-surface-sunken text-ink rounded-bl-sm"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p className={`mt-1 text-xs ${msg.sender === "buyer" ? "text-white/70" : "text-ink-soft"}`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
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
          <Button type="submit" disabled={!message.trim()}>Send</Button>
        </div>
      </form>
    </div>
  );
}
