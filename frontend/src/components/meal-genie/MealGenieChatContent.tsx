"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Send, ChefHat, Lightbulb, Calendar, Minus, Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { mealGenieApi } from "@/lib/api";
import { useChatHistory } from "@/hooks";

const SUGGESTIONS = [
  { icon: ChefHat, text: "What can I make with chicken?" },
  { icon: Lightbulb, text: "Quick weeknight dinner ideas" },
  { icon: Calendar, text: "Help me plan meals for the week" },
];

interface MealGenieChatContentProps {
  onClose?: () => void;
}

export function MealGenieChatContent({ onClose }: MealGenieChatContentProps) {
  const [input, setInput] = useState("");
  const { messages, addMessage, clearHistory } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Focus input on mount
  useEffect(() => {
    // Small delay to ensure animation completes
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setInput("");
    addMessage({ role: "user", content: textToSend });
    setIsLoading(true);

    try {
      const response = await mealGenieApi.ask(textToSend, messages);
      if (response.success && response.response) {
        addMessage({ role: "assistant", content: response.response });
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      addMessage({ role: "assistant", content: "Sorry, something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, addMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-secondary" />
          <h2 className="text-lg font-semibold text-foreground">Ask Meal Genie</h2>
        </div>
        <div className="flex items-center gap-1">
          {hasMessages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={clearHistory}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-hover transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Clear chat</TooltipContent>
            </Tooltip>
          )}
          {onClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-hover transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">Minimize</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Messages / Empty State Area */}
      <div className="flex-1 overflow-y-auto">
        {hasMessages ? (
          <div className="px-4 py-3 space-y-3">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[85%] px-3 py-2 text-sm leading-relaxed
                    ${message.role === "user"
                      ? "bg-secondary text-secondary-foreground rounded-2xl rounded-br-md"
                      : "bg-hover text-foreground rounded-2xl rounded-bl-md"
                    }
                  `}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-hover rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          /* Empty State with Suggestions */
          <div className="h-full flex flex-col items-center justify-center px-4 py-6">
            <p className="text-xs text-muted-foreground mb-3">Try asking:</p>
            <div className="space-y-2 w-full max-w-[280px]">
              {SUGGESTIONS.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSubmit(suggestion.text)}
                  disabled={isLoading}
                  className="
                    w-full flex items-center gap-2.5 px-3 py-2.5
                    text-sm text-left text-muted-foreground
                    bg-background/60 hover:bg-background
                    border border-border hover:border-border-strong
                    rounded-lg
                    button-weighted
                    disabled:opacity-50 disabled:cursor-not-allowed
                    group
                  "
                >
                  <suggestion.icon className="h-4 w-4 text-secondary/70 group-hover:text-secondary transition-colors duration-150" />
                  <span className="group-hover:text-foreground transition-colors duration-150">
                    {suggestion.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about recipes, cooking tips..."
            className="
              flex-1 px-3 py-2 text-sm
              bg-background border border-border rounded-lg
              placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary
              transition-shadow duration-150
            "
          />
          <button
            onClick={() => handleSubmit()}
            disabled={!input.trim() || isLoading}
            className="
              p-2 rounded-lg
              bg-secondary text-secondary-foreground
              hover:bg-secondary-hover
              button-weighted
              disabled:opacity-40 disabled:cursor-not-allowed
              disabled:transform-none disabled:shadow-none
            "
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
