"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Manages auto-scroll and fade indicators for a scrollable chat container.
 *
 * @param messageCount - Number of messages (triggers scroll when new messages arrive)
 * @param isPending - Whether a response is pending (triggers scroll for loading indicator)
 * @returns Refs and fade states for the scroll container
 */
export function useChatScroll(messageCount: number, isPending: boolean) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Auto-scroll to bottom when messages change or loading starts
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount, isPending]);

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
  }, [messageCount, isPending]);

  return { messagesEndRef, scrollContainerRef, showTopFade, showBottomFade };
}
