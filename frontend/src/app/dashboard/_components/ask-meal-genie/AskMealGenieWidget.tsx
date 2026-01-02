"use client";

import { useState, useCallback } from "react";
import { Sparkles, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { mealGenieApi } from "@/lib/api";
import type { MealGenieMessage } from "@/types";

export function AskMealGenieWidget() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MealGenieMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await mealGenieApi.ask(userMessage, messages);
      if (response.success && response.response) {
        const assistantMessage = response.response;
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: assistantMessage },
        ]);
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="bg-elevated rounded-xl p-4 border border-border shadow-raised flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-secondary" />
        <span className="text-sm font-medium text-foreground">Ask Meal Genie</span>
      </div>

      {/* Messages Area */}
      {hasMessages && (
        <div className="flex-1 min-h-0 max-h-32 overflow-y-auto mb-3 space-y-2">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`text-sm p-2 rounded-lg ${
                message.role === "user"
                  ? "bg-secondary/10 text-foreground ml-4"
                  : "bg-muted/20 text-muted mr-4"
              }`}
            >
              {message.content}
            </div>
          ))}
          {isLoading && (
            <div className="bg-muted/20 p-2 rounded-lg mr-4 space-y-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything about recipes, meal planning, cooking tips..."
          className="w-full h-20 px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary"
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="absolute bottom-3 right-3 p-1.5 rounded-md bg-secondary/20 text-secondary hover:bg-secondary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
