"use client";

import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CHAT_SUGGESTIONS } from "./constants";
import type { MealGenieMessage } from "@/types/ai";

interface ChatMessageListProps {
  messages: MealGenieMessage[];
  isPending: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  showTopFade: boolean;
  showBottomFade: boolean;
  afterLoadingSlot?: React.ReactNode;
  onSuggestionClick: (text: string) => void;
  isSuggestionDisabled?: boolean;
}

export function ChatMessageList({
  messages,
  isPending,
  scrollContainerRef,
  messagesEndRef,
  showTopFade,
  showBottomFade,
  afterLoadingSlot,
  onSuggestionClick,
  isSuggestionDisabled,
}: ChatMessageListProps) {
  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex-1 min-h-0">
      {/* Scroll fade indicators */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-elevated to-transparent pointer-events-none z-10 transition-opacity duration-200",
          showTopFade ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-elevated to-transparent pointer-events-none z-10 transition-opacity duration-200",
          showBottomFade ? "opacity-100" : "opacity-0"
        )}
      />

      <div ref={scrollContainerRef} className="h-full overflow-y-auto">
        {hasMessages ? (
          <div className="px-4 py-3 space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                        : "bg-gradient-to-br from-muted to-muted/80 border border-border/30 text-foreground rounded-2xl rounded-bl-sm whitespace-pre-line"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            <AnimatePresence>
              {isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start"
                >
                  <div className="bg-gradient-to-br from-muted to-muted/80 border border-border/30 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" strokeWidth={1.5} />
                      <span className="text-xs text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {afterLoadingSlot}

            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Empty State with Suggestions */
          <div className="h-full flex flex-col items-center justify-center px-4 py-6">
            <div className="p-3 rounded-full bg-primary-surface mb-4">
              <Sparkles className="h-7 w-7 text-primary" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Ask me anything about cooking!</p>
            <div className="space-y-2 w-full max-w-xs">
              {CHAT_SUGGESTIONS.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    onClick={() => onSuggestionClick(suggestion.text)}
                    disabled={isSuggestionDisabled}
                    className="w-full h-auto p-3 justify-start text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                        <suggestion.icon className={cn("h-4 w-4", suggestion.color)} strokeWidth={1.5} />
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        {suggestion.text}
                      </span>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
