import { useState } from "react";
import ConversationList from "../../components/messaging/ConversationList";
import ChatWindow from "../../components/messaging/ChatWindow";
import { mockConversations } from "../../data/mockData";

export default function Messages() {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeConversation, setActiveConversation] = useState(null);
  const [mobileView, setMobileView] = useState("list");

  const handleSendMessage = (conversationId, text) => {
    const updated = conversations.map((conv) => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, { id: Date.now(), sender: "buyer", text, time: "Just now" }],
          lastMessage: text,
          lastTime: "Just now",
        };
      }
      return conv;
    });
    setConversations(updated);
    if (activeConversation?.id === conversationId) {
      setActiveConversation({
        ...activeConversation,
        messages: [...activeConversation.messages, { id: Date.now(), sender: "buyer", text, time: "Just now" }],
        lastMessage: text,
        lastTime: "Just now",
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-ink mb-4">Messages</h1>

      <div className="flex h-[70vh] overflow-hidden rounded-xl border border-border bg-surface">
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-border ${mobileView === "chat" ? "hidden md:block" : ""}`}>
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id}
            onSelect={(conv) => {
              setActiveConversation(conv);
              setMobileView("chat");
            }}
          />
        </div>

        {/* Chat Window */}
        <div className={`flex-1 ${mobileView === "list" ? "hidden md:flex" : ""}`}>
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              onBack={() => setMobileView("list")}
              onSend={handleSendMessage}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-ink-soft">
              Select a conversation to view messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
