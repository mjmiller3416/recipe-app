"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, X, Minimize2, Maximize2, Minus, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useChatHistory } from "@/hooks/persistence";
import { useMealGenieChat } from "@/hooks/api/useAI";
import { useChatScroll } from "@/hooks/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChatMessageList } from "./ChatMessageList";
import type { GeneratedRecipeDTO } from "@/types/ai";

// Session storage key for AI-generated recipe (must match useRecipeForm.ts)
const AI_RECIPE_STORAGE_KEY = "meal-genie-generated-recipe";

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
  const { messagesEndRef, scrollContainerRef, showTopFade, showBottomFade } = useChatScroll(messages.length, chatMutation.isPending);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track pending recipe for "View Recipe Draft" button
  const [pendingRecipe, setPendingRecipe] = useState<{
    recipe: GeneratedRecipeDTO;
    referenceImageData: string | null;
    bannerImageData: string | null;
  } | null>(null);

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
      <ChatMessageList
        messages={messages}
        isPending={chatMutation.isPending}
        scrollContainerRef={scrollContainerRef}
        messagesEndRef={messagesEndRef}
        showTopFade={showTopFade}
        showBottomFade={showBottomFade}
        onSuggestionClick={handleSubmit}
        isSuggestionDisabled={chatMutation.isPending}
        afterLoadingSlot={
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
                  <FileText className="h-4 w-4" strokeWidth={1.5} />
                  View Recipe Draft
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        }
      />

      {/* Input Area */}
      <div className="p-3 border-t border-border/50 bg-muted/30">
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
