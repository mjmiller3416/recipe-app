"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  unitConversionApi,
  UnitConversionRuleDTO,
  UnitConversionRuleCreateDTO,
} from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface UseUnitConversionRulesReturn {
  rules: UnitConversionRuleDTO[];
  isLoading: boolean;
  error: Error | null;
  createRule: (data: UnitConversionRuleCreateDTO) => Promise<void>;
  deleteRule: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing unit conversion rules.
 * Provides CRUD operations for ingredient-specific unit conversions.
 *
 * @example
 * const { rules, createRule, deleteRule, isLoading } = useUnitConversionRules();
 *
 * // Create a new rule
 * await createRule({ ingredient_name: "butter", from_unit: "tbs", to_unit: "stick", factor: 8 });
 *
 * // Delete a rule
 * await deleteRule(ruleId);
 */
export function useUnitConversionRules(): UseUnitConversionRulesReturn {
  const { getToken } = useAuth();
  const [rules, setRules] = useState<UnitConversionRuleDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all rules
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await unitConversionApi.list(token);
      setRules(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch rules");
      setError(error);
      console.error("Failed to fetch unit conversion rules:", err);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Create a new rule
  const createRule = useCallback(async (data: UnitConversionRuleCreateDTO) => {
    try {
      const token = await getToken();
      const newRule = await unitConversionApi.create(data, token);
      setRules((prev) => [...prev, newRule]);
      toast.success(`Conversion rule for "${data.ingredient_name}" created`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create rule";
      toast.error(message);
      throw err;
    }
  }, [getToken]);

  // Delete a rule
  const deleteRule = useCallback(async (id: number) => {
    try {
      const token = await getToken();
      await unitConversionApi.delete(id, token);
      setRules((prev) => prev.filter((rule) => rule.id !== id));
      toast.success("Conversion rule deleted");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete rule";
      toast.error(message);
      throw err;
    }
  }, [getToken]);

  return {
    rules,
    isLoading,
    error,
    createRule,
    deleteRule,
    refresh,
  };
}
