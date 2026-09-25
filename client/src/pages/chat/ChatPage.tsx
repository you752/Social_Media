import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { ConversationList } from "@/components/chat/ConversationList";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "@/components/common/EmptyState";
import { PageSpinner } from "@/components/common/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { useSocketEvent } from "@/hooks/useSocket";
import { useNotifications } from "@/hooks/useNotifications";
import * as chatApi from "@/api/chat.api";
import * as userApi from "@/api/user.api";
import { getApiErrorMessage } from "@/api/axios";
import { useToast } from "@/hooks/useToast";
import { displayName } from "@/utils/getUser";
import type { Message } from "@/types/chat";
import type { User } from "@/types/user";

export function ChatPage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { incrementUnreadMessages, resetUnreadMessages } = useNotifications();

  const [messages, setMessages] = useState<Message[]>([]);
  const [peer, setPeer] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const seenIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    seenIds.current = new Set();

    Promise.all([chatApi.getConversation(userId), userApi.getUsers()])
      .then(([msgs, users]) => {
        const list = Array.isArray(msgs) ? msgs : [];
        list.forEach((m) => seenIds.current.add(m._id));
        setMessages(list);
        const found = Array.isArray(users) ? users.find((u) => u._id === userId) : undefined;
        setPeer(found ?? null);
      })
      .catch((err) => showToast(getApiErrorMessage(err, "Could not load conversation"), "error"))
      .finally(() => setLoading(false));

    chatApi.markConversationRead(userId).catch(() => {});
    resetUnreadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time incoming messages, delivered by realtimeModule.deliverMessage
  // on the backend. ASSUMPTION: the event name is "message" and the
  // payload is the message object itself — adjust if the backend uses a
  // different event name.
  const handleIncoming = useCallback(
    (message: Message) => {
      if (seenIds.current.has(message._id)) return;
      seenIds.current.add(message._id);

      const targetId = message.recipientId || message.receiverId;
      const isForThisConversation =
        userId && (message.senderId === userId || targetId === userId);

      if (isForThisConversation) {
        setMessages((prev) => [...prev, message]);
        if (message.senderId === userId) {
          chatApi.markConversationRead(userId).catch(() => {});
        }
      } else if (message.senderId !== currentUser?._id) {
        incrementUnreadMessages();
        showToast("New message", "info");
      }
    },
    [userId, currentUser?._id, incrementUnreadMessages, showToast]
  );

  useSocketEvent<Message>("chat:message", handleIncoming);

  async function handleSend(content: string) {
    if (!userId) return;
    try {
      const message = await chatApi.sendMessage({ receiverId: userId, content });
      if (!seenIds.current.has(message._id)) {
        seenIds.current.add(message._id);
        setMessages((prev) => [...prev, message]);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, "Could not send message"), "error");
    }
  }

  const sortedMessages = useMemo(
    () => [...messages].sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()),
    [messages]
  );

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <ConversationList />
      </div>

      <div className="chat-main">
        {!userId ? (
          <EmptyState icon={<MessageCircle size={28} />} title="Select a conversation" description="Pick a friend to start chatting." />
        ) : (
          <>
            <div className="chat-header">
              <Avatar user={peer} size="sm" online={peer?.isOnline} />
              <strong>{displayName(peer)}</strong>
            </div>

            <div className="chat-messages">
              {loading ? (
                <PageSpinner />
              ) : sortedMessages.length === 0 ? (
                <EmptyState icon={<MessageCircle size={24} />} title="No messages yet" description="Say hello!" />
              ) : (
                sortedMessages.map((m) => (
                  <MessageBubble key={m._id} message={m} isMine={m.senderId === currentUser?._id} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <MessageInput onSend={handleSend} />
          </>
        )}
      </div>
    </div>
  );
}
