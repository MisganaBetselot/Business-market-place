import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getInquiries, getInquiryThread, sendInquiryReply } from "../../api/inquiries";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ChatWindow from "../../components/messaging/ChatWindow";
import ConversationList from "../../components/messaging/ConversationList";
import { useAuth } from "../../hooks/useAuth";

export default function Messages() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkedId = searchParams.get("inquiry");

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [activeId, setActiveId] = useState(deepLinkedId ? Number(deepLinkedId) : null);
  const [thread, setThread] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState(deepLinkedId ? "chat" : "list");

  const loadConversations = useCallback(async () => {
    setLoadingList(true);
    setListError("");
    try {
      const data = await getInquiries();
      const arr = Array.isArray(data) ? data : data.results ?? [];
      setConversations(arr);
    } catch {
      setListError("Couldn't load your messages.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(async (id) => {
    setLoadingThread(true);
    try {
      const data = await getInquiryThread(id);
      setThread(data);
      // Opening a thread marks the other party's messages as read server-side;
      // refresh the list so unread badges stay accurate.
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread_count: 0 } : c))
      );
    } catch {
      setThread(null);
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadThread(activeId);
  }, [activeId, loadThread]);

  const handleSelect = (conv) => {
    setActiveId(conv.id);
    setSearchParams({ inquiry: conv.id });
    setMobileView("chat");
  };

  const handleSend = async (message) => {
    if (!activeId) return;
    setSending(true);
    try {
      await sendInquiryReply(activeId, message);
      await loadThread(activeId);
      loadConversations();
    } catch {
      // leave the message in the input-less state; a toast/error banner
      // could be added here if the design calls for one
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="font-display text-xl font-semibold text-ink mb-4">Messages</h1>

      <div className="flex h-[70vh] overflow-hidden rounded-xl border border-border bg-surface">
        {/* Conversation List */}
        <div className={`w-full md:w-80 border-b md:border-b-0 md:border-r border-border ${mobileView === "chat" ? "hidden md:block" : ""}`}>
          {loadingList ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner centered label="Loading conversations…" />
            </div>
          ) : listError ? (
            <div className="flex h-full items-center justify-center px-4 text-center text-sm text-danger">
              {listError}
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeId}
              currentUserId={user?.id}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* Chat Window */}
        <div className={`flex-1 ${mobileView === "list" ? "hidden md:flex" : ""}`}>
          {loadingThread ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner centered label="Loading conversation…" />
            </div>
          ) : (
            <ChatWindow
              thread={thread}
              currentUserId={user?.id}
              onBack={() => setMobileView("list")}
              onSend={handleSend}
              sending={sending}
            />
          )}
        </div>
      </div>
    </div>
  );
}
