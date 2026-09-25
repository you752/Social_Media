import clsx from "clsx";
import { timeAgo } from "@/utils/date";
import type { Message } from "@/types/chat";

export function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  return (
    <div className={clsx("message-row", isMine && "message-row-mine")}>
      <div className={clsx("message-bubble", isMine && "message-bubble-mine")}>
        <p>{message.content}</p>
        <span className="message-time">{timeAgo(message.createdAt)}</span>
      </div>
    </div>
  );
}
