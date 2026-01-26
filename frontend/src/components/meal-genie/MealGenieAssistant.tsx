"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Send, ChefHat, Lightbulb, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { mealGenieApi } from "@/lib/api";
import { useChatHistory } from "@/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: ChefHat, text: "What can I make with chicken?", color: "text-primary" },
  { icon: Lightbulb, text: "Quick weeknight dinner ideas", color: "text-secondary" },
  { icon: Calendar, text: "Help me plan meals for the week", color: "text-success" },
];

export function AskMealGenieWidget() {
  const [input, setInput] = useState("");
  const { messages, addMessage, clearHistory } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Track scroll position for fade indicators
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowTopFade(scrollTop > 8);
      setShowBottomFade(scrollTop + clientHeight < scrollHeight - 8);
    };

    handleScroll();
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages]);

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
                            : "bg-gradient-to-br from-muted to-muted/80 border border-border/30 text-foreground rounded-2xl rounded-bl-sm"
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
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gradient-to-br from-muted to-muted/80 border border-border/30 rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                          <span className="text-xs text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Empty State with Suggestions */
              <div className="h-full flex flex-col items-center justify-center px-4 py-6">
                <div className="p-3 rounded-full bg-primary-surface mb-4">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-4">Ask me anything about cooking!</p>
                <div className="space-y-2 w-full max-w-xs">
                  {SUGGESTIONS.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.2 }}
                    >
                      <Button
                        variant="outline"
                        onClick={() => handleSubmit(suggestion.text)}
                        disabled={isLoading}
                        className="w-full h-auto p-3 justify-start text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                            <suggestion.icon className={cn("h-4 w-4", suggestion.color)} />
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
              disabled={!input.trim() || isLoading}
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