"use client";

import { useState } from "react";
import type { PrintOptions } from "./PrintPreviewDialog";

/**
 * Custom hook for managing print state and functionality.
 * Handles print dialog visibility, print options, and triggering the print action.
 */
export function usePrintRecipe() {
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    showImage: true,
    showNotes: true,
    showMeta: true,
  });

  /**
   * Handles the print action by setting options and triggering window.print().
   * Uses setTimeout to ensure state is updated before printing.
   */
  const handlePrint = (options: PrintOptions) => {
    setPrintOptions(options);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return {
    printDialogOpen,
    setPrintDialogOpen,
    printOptions,
    handlePrint,
  };
}
