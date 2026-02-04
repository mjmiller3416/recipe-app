"use client";

import { useState, useCallback } from "react";
import { Sparkles, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatHistory } from "@/hooks/persistence";
import { useMealGenieAsk } from "@/hooks/api/useAI";
import { useChatScroll } from "@/hooks/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessageList } from "./ChatMessageList";

export function AskMealGenieWidget() {
  const [input, setInput] = useState("");
  const { messages, addMessage, clearHistory } = useChatHistory();
  const askMutation = useMealGenieAsk();
  const { messagesEndRef, scrollContainerRef, showTopFade, showBottomFade } = useChatScroll(messages.length, askMutation.isPending);

  const handleSubmit = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || askMutation.isPending) return;

    setInput("");
    addMessage({ role: "user", content: textToSend });

    try {
      const response = await askMutation.mutateAsync({
        message: textToSend,
        conversationHistory: messages,
      });
      if (response.success && response.response) {
        addMessage({ role: "assistant", content: response.response });
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      addMessage({ role: "assistant", content: "Sorry, something went wrong. Please try again." });
    }
  }, [input, askMutation, messages, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <Card className="relative shadow-raised flex flex-col overflow-hidden h-full print:hidden">
      {/* Noise texture background */}
      <div 
        className="absolute inset-0 bg-elevated opacity-60"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-elevated/[0.97]" />
      
      {/* Content container */}
      <div className="relative flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary-surface">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Ask Meal Genie</h2>
          </div>
          <AnimatePresence>
            {hasMessages && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground"
                >
                  Clear
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages / Empty State Area */}
        <ChatMessageList
          messages={messages}
          isPending={askMutation.isPending}
          scrollContainerRef={scrollContainerRef}
          messagesEndRef={messagesEndRef}
          showTopFade={showTopFade}
          showBottomFade={showBottomFade}
          onSuggestionClick={handleSubmit}
          isSuggestionDisabled={askMutation.isPending}
        />

        {/* Input Area */}
        <div className="mt-auto p-3 border-t border-border/50 bg-card/30">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about recipes, cooking tips..."
              className="flex-1 bg-background/50"
            />
            <Button
              size="icon"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || askMutation.isPending}
              aria-label="Send message"
              className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm disabled:bg-muted disabled:text-muted-foreground"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}