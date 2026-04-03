import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearch, useLocation } from "wouter";
import { Send, Sparkles, Hotel, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGetOpenaiConversation, useListOpenaiMessages } from "@workspace/api-client-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { ChatBubble } from "@/components/chat/chat-bubble";
import { LuxuryButton } from "@/components/ui/luxury-button";

export default function ChatPage() {
  const { id } = useParams();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const conversationId = id ? parseInt(id, 10) : undefined;

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [input, setInput] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const autoSentRef = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log("ChatPage mounted/updated:", { id, conversationId, search });
  }, [id, conversationId, search]);

  // Delay fetching to ensure conversation exists in DB
  const { data: conversation, isLoading: isConvLoading, isError: isConvError, error: convError } = useGetOpenaiConversation(
    conversationId as number,
    { query: { enabled: !!conversationId, staleTime: Infinity, retry: 3 } }
  );

  useEffect(() => {
    console.log("Conversation query result:", { isConvLoading, isConvError, convError, conversation });
  }, [conversation, isConvLoading, isConvError, convError]);

  const { data: messages = [], isLoading: isMessagesLoading, isError: isMsgsError } = useListOpenaiMessages(
    conversationId as number,
    { query: { enabled: !!conversationId && !isConvError, staleTime: Infinity, retry: 3 } }
  );

  const { sendMessage, isStreaming, streamedContent, optimisticUserMessage } =
    useChatStream(conversationId);

  // Auto-send initial message from suggestion chip (?init=...)
  useEffect(() => {
    if (autoSentRef.current || !conversationId || isConvLoading || isMessagesLoading) return;
    const params = new URLSearchParams(search);
    const initMsg = params.get("init");
    if (initMsg && messages.length === 0) {
      autoSentRef.current = true;
      sendMessage(initMsg);
    }
  }, [conversationId, isConvLoading, isMessagesLoading, messages.length, search, sendMessage]);

  // Detect scroll position to show/hide the scroll-to-bottom button
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distanceFromBottom > 120);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll when new content arrives only if already near bottom
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom < 200) {
      scrollToBottom("smooth");
    }
  }, [messages, streamedContent, optimisticUserMessage, scrollToBottom]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
    // scroll instantly when user sends
    setTimeout(() => scrollToBottom("smooth"), 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isConvLoading || isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-7 h-7 text-primary/50" />
        </motion.div>
        <p className="text-muted-foreground text-sm tracking-wide">Preparing your concierge…</p>
      </div>
    );
  }

  if (isConvError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">Failed to load conversation</p>
        <button onClick={() => setLocation("/")} className="px-4 py-2 bg-primary text-white rounded">
          Go Back Home
        </button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Conversation not found</p>
        <button onClick={() => setLocation("/")} className="px-4 py-2 bg-primary text-white rounded">
          Go Back Home
        </button>
      </div>
    );
  }

  const allMessages = messages;
  const totalVisible = allMessages.length + (optimisticUserMessage ? 1 : 0) + (isStreaming || streamedContent ? 1 : 0);

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* Header */}
      <div className="shrink-0 h-14 border-b border-border/40 bg-background/80 backdrop-blur-md flex items-center px-6 z-10">
        <h2 className="font-semibold text-base text-foreground truncate">
          {conversation?.title || "Conversation"}
        </h2>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto scroll-smooth pb-36 pt-2"
      >
        {allMessages.length === 0 && !optimisticUserMessage && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center px-4 gap-3"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Hotel className="w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">Say hello to Aria, your Seed concierge.</p>
          </motion.div>
        )}

        {allMessages.map((msg, i) => (
          <ChatBubble
            key={msg.id}
            role={msg.role as "user" | "assistant"}
            content={msg.content}
            index={i}
          />
        ))}

        {optimisticUserMessage && (
          <ChatBubble
            role="user"
            content={optimisticUserMessage}
            index={allMessages.length}
          />
        )}

        {(isStreaming || streamedContent) && (
          <ChatBubble
            role="assistant"
            content={streamedContent}
            isStreaming={!streamedContent}
            index={allMessages.length + (optimisticUserMessage ? 1 : 0)}
          />
        )}

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            key="scroll-btn"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-28 right-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-full bg-card border border-border shadow-lg text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all text-xs font-medium backdrop-blur-md"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            Scroll down
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background/98 to-transparent pt-8 pb-5 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative glass-panel rounded-2xl p-1.5 flex items-end shadow-lg border border-border focus-within:border-primary/30 transition-colors duration-200">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Aria…"
              className="w-full max-h-48 min-h-[44px] bg-transparent border-none resize-none focus:outline-none focus:ring-0 px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm leading-relaxed"
              rows={1}
              disabled={isStreaming}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement;
                t.style.height = "auto";
                t.style.height = `${Math.min(t.scrollHeight, 192)}px`;
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="shrink-0 mb-1 ml-2 h-9 w-9 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-center mt-2.5 text-[10px] text-muted-foreground/40 tracking-widest uppercase">
            Seed Hotel Concierge · Powered by AI
          </p>
        </div>
      </div>
    </div>
  );
}
