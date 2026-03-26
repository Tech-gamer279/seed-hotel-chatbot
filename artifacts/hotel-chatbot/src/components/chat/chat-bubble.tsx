import { motion } from "framer-motion";
import { Hotel, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  index?: number;
}

export function ChatBubble({ role, content, isStreaming, index = 0 }: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "flex w-full gap-3 py-5 px-4 md:px-8 max-w-4xl mx-auto",
        !isUser && "bg-white/[0.02] border-l-2 border-primary/40 rounded-r-2xl my-1"
      )}
    >
      {/* Avatar */}
      <div className={cn(
        "w-8 h-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm mt-0.5 border",
        isUser
          ? "bg-accent border-border"
          : "bg-primary/10 border-primary/20"
      )}>
        {isUser ? (
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Hotel className="w-3.5 h-3.5 text-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <span className="block text-[12px] font-semibold tracking-widest uppercase text-muted-foreground/70">
          {isUser ? "You" : "Aria · Seed Concierge"}
        </span>

        <div className="text-[15px] leading-relaxed text-foreground/90">
          {content ? (
            isUser ? (
              <p className="whitespace-pre-wrap">{content}</p>
            ) : (
              <div className="prose prose-invert prose-sm max-w-none
                prose-p:my-1 prose-p:leading-relaxed
                prose-ul:my-2 prose-ul:pl-4
                prose-ol:my-2 prose-ol:pl-4
                prose-li:my-0.5
                prose-strong:text-foreground prose-strong:font-semibold
                prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
                [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )
          ) : isStreaming ? (
            <div className="flex gap-1 items-center h-5 mt-1">
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary/70"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: 0, ease: "easeInOut" }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary/70"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: 0.15, ease: "easeInOut" }}
              />
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-primary/70"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
