"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, X, ChefHat, Lightbulb, Calendar, Minimize2, Maximize2, Minus, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useChatHistory } from "@/hooks";
import { useMealGenieChat } from "@/hooks/api/useAI";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { GeneratedRecipeDTO } from "@/types";

// Session storage key for AI-generated recipe (must match useRecipeForm.ts)
const AI_RECIPE_STORAGE_KEY = "meal-genie-generated-recipe";

const SUGGESTIONS = [
  { icon: ChefHat, text: "What can I make with chicken?", color: "text-primary" },
  { icon: Lightbulb, text: "Quick weeknight dinner ideas", color: "text-secondary" },
  { icon: Calendar, text: "Help me plan meals for the week", color: "text-success" },
];

interface MealGenieChatContentProps {
  onClose: () => void;
  isMinimized?: boolean;
  isExpanded?: boolean;
  onMinimize?: () => void;
  onExpand?: () => void;
  onCollapse?: () => void;
  isMobile?: boolean;
}

export function MealGenieChatContent({
  onClose,
  isMinimized = false,
  isExpanded = false,
  onMinimize,
  onExpand,
  onCollapse,
  isMobile = false,
}: MealGenieChatContentProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const { messages, addMessage, clearHistory } = useChatHistory();
  const chatMutation = useMealGenieChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Track pending recipe for "View Recipe Draft" button
  const [pendingRecipe, setPendingRecipe] = useState<{
    recipe: GeneratedRecipeDTO;
    referenceImageData: string | null;
    bannerImageData: string | null;
  } | null>(null);

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

  // Focus input when expanded
  useEffect(() => {
    if (!isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMinimized]);

  const handleSubmit = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || chatMutation.isPending) return;

    // Expand if minimized when submitting
    if (isMinimized && onExpand) {
      onExpand();
    }

    setInput("");
    addMessage({ role: "user", content: textToSend });

    try {
      // Single unified API call - AI decides what action to take
      const response = await chatMutation.mutateAsync({
        message: textToSend,
        conversationHistory: messages,
      });

      if (response.success) {
        // Check if AI generated a recipe
        if (response.recipe) {
          // Store recipe in state - show button instead of auto-navigating
          setPendingRecipe({
            recipe: response.recipe,
            referenceImageData: response.reference_image_data || null,
            bannerImageData: response.banner_image_data || null,
          });
          addMessage({ role: "assistant", content: response.response || "I've created a recipe for you!" });
        } else if (response.response) {
          // Normal chat response
          addMessage({ role: "assistant", content: response.response });
        }
      } else {
        throw new Error(response.error || "Failed to get response");
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      addMessage({ role: "assistant", content: "Sorry, something went wrong. Please try again." });
    }
  }, [input, chatMutation, messages, addMessage, isMinimized, onExpand]);

  // Navigate to recipe form when user clicks "View Recipe Draft"
  const handleViewRecipe = useCallback(() => {
    if (!pendingRecipe) return;
    sessionStorage.setItem(AI_RECIPE_STORAGE_KEY, JSON.stringify(pendingRecipe));
    router.push("/recipes/add?from=ai");
    setPendingRecipe(null);
  }, [pendingRecipe, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasMessages = messages.length > 0;

  // Minimized state - just show header bar (desktop only)
  if (isMinimized && !isMobile) {
    return (
      <Button
        variant="ghost"
        onClick={onExpand}
        className="w-full h-full rounded-full"
        aria-label="Expand Meal Genie"
      >
        <Sparkles className="size-7 text-primary" />
      </Button>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile drag handle */}
      {isMobile && (
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary-surface">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">Meal Genie</h2>
        </div>
        <div className="flex items-center gap-1">
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
          {/* Expand/Collapse button - desktop only */}
          {!isMobile && (isExpanded ? onCollapse : onExpand) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={isExpanded ? onCollapse : onExpand}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          {/* Minimize to circle button - desktop only, not when expanded */}
          {!isMobile && !isExpanded && onMinimize && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMinimize}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              aria-label="Minimize to icon"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
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
                {chatMutation.isPending && (
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

              {/* View Recipe Draft button - shown when a recipe is ready */}
              <AnimatePresence>
                {pendingRecipe && !chatMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="flex justify-start"
                  >
                    <Button
                      onClick={handleViewRecipe}
                      className="gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
                    >
                      <FileText className="h-4 w-4" />
                      View Recipe Draft
                    </Button>
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
                      disabled={chatMutation.isPending}
                      className="w-full h-auto p-3 justify-start text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-muted">
                          <suggestion.icon className={cn("h-4 w-4", suggestion.color)} />
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground">
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
      <div className="p-3 border-t border-border/50 bg-card/30">
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about recipes, cooking tips..."
            className={cn(
              "flex-1 bg-background/50",
              "focus-visible:ring-ring/30 focus-visible:ring-offset-0 focus-visible:border-ring/50",
              "placeholder:text-muted-foreground/60"
            )}
          />
          <Button
            size="icon"
            onClick={() => handleSubmit()}
            disabled={!input.trim() || chatMutation.isPending}
            aria-label="Send message"
            className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-sm disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
