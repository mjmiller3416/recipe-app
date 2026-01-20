# Design System Audit Report: MealGenieAssistant.tsx

**File:** `frontend/src/components/meal-genie/MealGenieAssistant.tsx`  
**Applicable Rules:** Part A (Component Usage) + Parts C, D, E

---

## Summary

| Category | Violations Found |
|----------|-----------------|
| **Critical** | 4 |
| **Medium** | 6 |
| **Low** | 2 |

---

## Violations

### ≡ƒö┤ CRITICAL Violations

#### 1. **A1 - Fake Card Pattern** (Line 82)
```tsx
// VIOLATION: Using Card but with manual bg-elevated styling that conflicts
<Card className="relative shadow-raised flex flex-col overflow-hidden h-full print:hidden">
  {/* Noise texture background */}
  <div 
    className="absolute inset-0 bg-elevated opacity-60"  // Line 85
```
**Issue:** The `bg-elevated` div creates a fake layered surface that should be handled by Card's built-in styling or a proper variant.

#### 2. **A6 - Hardcoded Colors** (Lines 97-98, 192-193)
```tsx
// Line 97-98
<div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
  <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />

// Line 192-193
<div className="p-3 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 mb-4">
  <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
```
**Issue:** Uses raw Tailwind colors (`amber-100`, `orange-100`, `amber-600`, `amber-400`) instead of semantic tokens.

#### 3. **A6 - Hardcoded Colors in SUGGESTIONS** (Lines 14-16)
```tsx
{ icon: ChefHat, text: "What can I make with chicken?", color: "text-amber-600 dark:text-amber-400" },
{ icon: Lightbulb, text: "Quick weeknight dinner ideas", color: "text-yellow-600 dark:text-yellow-400" },
{ icon: Calendar, text: "Help me plan meals for the week", color: "text-emerald-600 dark:text-emerald-400" },
```
**Issue:** Hardcoded color classes instead of semantic tokens.

#### 4. **A6 - Hardcoded Colors in Send Button** (Lines 243-246)
```tsx
className={cn(
  "bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600",
  "text-white shadow-sm",
  "disabled:from-muted disabled:to-muted disabled:text-muted-foreground"
)}
```
**Issue:** Hardcoded gradient colors and `text-white` instead of semantic tokens.

---

### ≡ƒƒí MEDIUM Violations

#### 5. **A5 - Redundant Transitions on Message Bubbles** (Lines 157-159)
```tsx
// Message bubbles already use Framer Motion for animation
// But this is acceptable since they're not base components
```
*Actually OK - Framer Motion is appropriate for enter/exit animations per E1*

#### 6. **C1 - Inconsistent Spacing** (Lines 141, 196)
```tsx
<div className="px-4 py-3 space-y-3">  // Line 141 - uses space-y-3
<div className="space-y-2 w-full max-w-xs">  // Line 196 - uses space-y-2
```
**Issue:** Mixed spacing values within similar contexts. Should be consistent.

#### 7. **A6 - Border Color Pattern** (Lines 95, 228)
```tsx
<div className="...border-b border-border/50">  // Line 95
<div className="...border-t border-border/50 bg-card/30">  // Line 228
```
**Issue:** Using `border-border/50` opacity modifier inconsistently. Should use `border-subtle` token for lighter borders.

#### 8. **Loading Indicator Hardcoded Color** (Line 180)
```tsx
<Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
```
**Issue:** `text-amber-500` is hardcoded instead of semantic token.

#### 9. **Gradient Backgrounds on Message Bubbles** (Lines 159, 178)
```tsx
"bg-gradient-to-br from-muted to-muted/80 border border-border/30"
```
**Issue:** While using tokens, the opacity modifiers are arbitrary. Consider using defined surface variants.

#### 10. **Missing aria-label on Clear Button** (Lines 110-117)
```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={clearHistory}
  className="text-xs h-7 text-muted-foreground hover:text-foreground"
>
  Clear
</Button>
```
**Issue:** While text is visible, the `h-7` manual sizing violates **A4** (no manual sizing overrides).

---

### ≡ƒƒó LOW Violations

#### 11. **Manual Height Override** (Line 114)
```tsx
className="text-xs h-7 text-muted-foreground hover:text-foreground"
```
**Issue:** `h-7` is manual sizing. Button already has `size="sm"` which should handle this.

#### 12. **Redundant Text Size** (Line 114)
```tsx
className="text-xs h-7..."
```
**Issue:** `text-xs` overrides the Button's built-in typography. Remove it.

---

## Corrected Code

```tsx
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, Send, ChefHat, Lightbulb, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { mealGenieApi } from "@/lib/api";
import { useChatHistory } from "@/hooks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: ChefHat, text: "What can I make with chicken?", color: "text-primary" },
  { icon: Lightbulb, text: "Quick weeknight dinner ideas", color: "text-warning" },
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
      {/* Content container */}
      <div className="relative flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary-surface">
              <Sparkles className="h-4 w-4 text-primary" />
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
                  className="text-muted-foreground hover:text-foreground"
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
              "absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-card to-transparent pointer-events-none z-10 transition-opacity duration-200",
              showTopFade ? "opacity-100" : "opacity-0"
            )}
          />
          <div 
            className={cn(
              "absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-card to-transparent pointer-events-none z-10 transition-opacity duration-200",
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
                            : "bg-muted border border-border-subtle text-foreground rounded-2xl rounded-bl-sm"
                        )}
                      >
                        {message.content}
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
                      <div className="bg-muted border border-border-subtle rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
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
                  <Sparkles className="h-6 w-6 text-primary" />
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
                          <div className="p-2 rounded-lg bg-muted group-hover:bg-accent transition-colors">
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
        <div className="mt-auto p-3 border-t border-border-subtle bg-card/50">
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
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

---

## Key Changes Summary

| Line(s) | Before | After | Rule |
|---------|--------|-------|------|
| 14-16 | `text-amber-600`, `text-yellow-600`, `text-emerald-600` | `text-primary`, `text-warning`, `text-success` | A6 |
| 84-90 | Noise texture `bg-elevated` div | Removed (unnecessary) | A1 |
| 95, 228 | `border-border/50` | `border-border-subtle` | A6/F3 |
| 97-98 | `from-amber-100 to-orange-100` gradient | `bg-primary-surface` | A6 |
| 114 | `text-xs h-7` | Removed (use size prop) | A4 |
| 128, 134 | `from-elevated` | `from-card` | A6 |
| 159, 178 | `from-muted to-muted/80` gradient | `bg-muted` solid | A6 |
| 180 | `text-amber-500` | `text-primary` | A6 |
| 192-193 | `from-amber-100 to-orange-100` gradient | `bg-primary-surface` | A6 |
| 243-246 | Hardcoded amber/orange gradient | Default Button styling | A6 |

---

`Γÿà Insight ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`
**Why semantic tokens matter here:**
1. The amber/orange brand colors aren't defined in your design system - using `primary` tokens ensures the component adapts when brand colors change
2. `border-border-subtle` is specifically designed for lighter separators, while `border-border/50` is an arbitrary opacity that may not match other components
3. Removing the noise texture background simplifies the component while the Card's built-in styling provides sufficient visual hierarchy
`ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ`

---

**To auto-fix:** Run `/ds-fix C:\Users\mjmil\Documents\recipe-app\frontend\src\components\meal-genie\MealGenieAssistant.tsx`
