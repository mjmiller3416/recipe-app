"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, ChefHat, Lightbulb, Calendar, Minus, Trash2, Plus, ExternalLink } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { mealGenieApi } from "@/lib/api";
import { useChatHistory } from "@/hooks";
import type { GeneratedRecipeDTO } from "@/types";

const SUGGESTIONS = [
  { icon: ChefHat, text: "What can I make with chicken?" },
  { icon: Lightbulb, text: "Quick weeknight dinner ideas" },
  { icon: Calendar, text: "Help me plan meals for the week" },
  { icon: Plus, text: "Create a new pasta recipe" },
];

// Patterns that indicate user wants to create a new recipe
const RECIPE_CREATE_PATTERNS = [
  /\bcreate\b.*\brecipe\b/i,         // "create a recipe"
  /\bmake\b.*\brecipe\b/i,           // "make me a recipe"
  /\bgenerate\b.*\brecipe\b/i,       // "generate a recipe"
  /\bnew\s+recipe\b/i,               // "new recipe"
  /\binvent\b.*\brecipe\b/i,         // "invent a recipe"
  /\bcome up with\b.*\brecipe\b/i,   // "come up with a recipe"
  /\bgive me a recipe\b/i,           // "give me a recipe"
  /\bi want a recipe\b/i,            // "I want a recipe"
  /\bi need a recipe\b/i,            // "I need a recipe"
  /\bdesign\b.*\brecipe\b/i,         // "design a recipe"
  /\bthink of\b.*\brecipe\b/i,       // "think of a recipe"
  /\brecipe for\b/i,                 // "recipe for pasta", "give me a recipe for..."
];

// Session storage key for AI-generated recipe
const AI_RECIPE_STORAGE_KEY = "meal-genie-generated-recipe";

function isRecipeCreationRequest(text: string): boolean {
  return RECIPE_CREATE_PATTERNS.some(pattern => pattern.test(text));
}

interface MealGenieChatContentProps {
  onClose?: () => void;
}

export function MealGenieChatContent({ onClose }: MealGenieChatContentProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const { messages, addMessage, clearHistory } = useChatHistory();
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Recipe creation state
  const [isRecipeMode, setIsRecipeMode] = useState(false);
  const [pendingRecipe, setPendingRecipe] = useState<GeneratedRecipeDTO | null>(null);
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, pendingRecipe]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle navigating to Add Recipe page with pre-filled data
  const handlePreviewRecipe = useCallback(() => {
    if (!pendingRecipe) return;

    // Store recipe data in sessionStorage
    const recipeData = {
      recipe: pendingRecipe,
      imageData: pendingImageData,
    };
    sessionStorage.setItem(AI_RECIPE_STORAGE_KEY, JSON.stringify(recipeData));

    // Clear pending state
    setPendingRecipe(null);
    setPendingImageData(null);
    setIsRecipeMode(false);

    // Navigate to Add Recipe page
    router.push("/recipes/add?from=ai");
  }, [pendingRecipe, pendingImageData, router]);

  const handleSubmit = useCallback(async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    setInput("");
    addMessage({ role: "user", content: textToSend });
    setIsLoading(true);

    // Check if this is a recipe creation request or we're in recipe mode
    const shouldUseRecipeMode = isRecipeMode || isRecipeCreationRequest(textToSend);

    try {
      if (shouldUseRecipeMode) {
        // Use recipe generation API
        setIsRecipeMode(true);
        const response = await mealGenieApi.generateRecipe(textToSend, messages);

        if (!response.success) {
          throw new Error(response.error || "Failed to generate recipe");
        }

        if (response.needs_more_info) {
          // AI is asking follow-up questions
          addMessage({
            role: "assistant",
            content: response.ai_message || "Could you tell me more about what you'd like?",
          });
        } else if (response.recipe) {
          // We have a complete recipe - store it and show preview button
          setPendingRecipe(response.recipe);
          setPendingImageData(response.image_data || null);
          addMessage({
            role: "assistant",
            content: `Your recipe "${response.recipe.recipe_name}" is ready! Click the button below to preview and edit it before saving.`,
          });
        }
      } else {
        // Regular chat mode
        const response = await mealGenieApi.ask(textToSend, messages);
        if (response.success && response.response) {
          addMessage({ role: "assistant", content: response.response });
        } else {
          throw new Error(response.error || "Failed to get response");
        }
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      addMessage({
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, addMessage, isRecipeMode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setPendingRecipe(null);
    setPendingImageData(null);
    setIsRecipeMode(false);
  }, [clearHistory]);

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
                  onClick={handleClearHistory}
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

            {/* Preview Recipe Button - shown when recipe is ready */}
            {pendingRecipe && !isLoading && (
              <div className="flex justify-start">
                <Button
                  onClick={handlePreviewRecipe}
                  className="gap-2"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4" />
                  Preview & Edit Recipe
                </Button>
              </div>
            )}

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
            placeholder={isRecipeMode ? "Describe your preferences..." : "Ask about recipes, cooking tips..."}
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

// Export the storage key so useRecipeForm can use it
export { AI_RECIPE_STORAGE_KEY };
