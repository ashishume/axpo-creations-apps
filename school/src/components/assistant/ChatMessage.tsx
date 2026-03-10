import { Bot, User, AlertCircle } from "lucide-react";
import { AnalyticsCard, type AnalyticsData } from "./AnalyticsCard";
import { cn } from "../../lib/utils";

export interface ChatMessageData {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isError?: boolean;
  analytics?: AnalyticsData;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300"
            : message.isError
            ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : message.isError ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Content */}
      <div className={cn("flex max-w-[80%] flex-col gap-2", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-indigo-600 text-white dark:bg-indigo-500"
              : message.isError
              ? "bg-red-50 text-red-800 border border-red-200 dark:bg-red-950/50 dark:text-red-200 dark:border-red-800"
              : "bg-white text-slate-800 shadow-sm border border-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700"
          )}
        >
          {/* Render content with line breaks */}
          {message.content.split("\n").map((line, idx) => (
            <p key={idx} className={idx > 0 ? "mt-1" : ""}>
              {line || "\u00A0"}
            </p>
          ))}
        </div>

        {/* Analytics card if present */}
        {message.analytics && <AnalyticsCard data={message.analytics} />}

        {/* Timestamp */}
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}
