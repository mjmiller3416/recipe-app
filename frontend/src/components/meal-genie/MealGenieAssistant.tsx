"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Send, ChefHat, Lightbulb, Calendar } from "lucide-react";
import { mealGenieApi } from "@/lib/api";
import { useChatHistory } from "@/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SUGGESTIONS = [
  { icon: ChefHat, text: "What can I make with chicken?" },
  { icon: Lightbulb, text: "Quick weeknight dinner ideas" },
  { icon: Calendar, text: "Help me plan meals for the week" },
];

export function AskMealGenieWidget() {
  const [input, setInput] = useState("");
  const { messages, addMessage, clearHistory } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

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
    <Card className="relative shadow-raised flex flex-col overflow-hidden h-full">
      {/* Noise texture background */}
      <div 
        className="absolute inset-0 bg-elevated"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-elevated/[0.97]" />
      
      {/* Content container */}
      <div className="relative flex flex-col flex-1 min-h-0">
        {/* Header - matches other dashboard widgets */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-secondary" />
            <h2 className="text-lg font-semibold text-foreground">Ask Meal Genie</h2>
          </div>
          {hasMessages && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-xs h-7"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Messages / Empty State Area - flex-1 fills available height */}
        <div className="flex-1 overflow-y-auto">
          {hasMessages ? (
            <div className="px-4 pb-3 space-y-3">
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
            /* Empty State with Suggestions - centered vertically */
            <div className="h-full flex flex-col items-center justify-center px-4 py-6">
              <p className="text-xs text-muted-foreground mb-3">Try asking:</p>
              <div className="space-y-2 w-full max-w-xs">
                {SUGGESTIONS.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => handleSubmit(suggestion.text)}
                    disabled={isLoading}
                    className="w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground group"
                  >
                    <suggestion.icon className="h-4 w-4 text-secondary/70 group-hover:text-secondary" />
                    <span>{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area - anchored to bottom with mt-auto */}
        <div className="mt-auto p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about recipes, cooking tips..."
              className="flex-1"
            />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => handleSubmit()}
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}