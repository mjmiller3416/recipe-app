import type { FeedbackSubmitDTO, FeedbackResponseDTO } from "@/types/common";
import { fetchApi } from "./client";

export const feedbackApi = {
  /**
   * Submit user feedback as a GitHub issue
   * @param data - The feedback category and message
   * @param token - Optional auth token for authenticated requests
   * @returns Response with success status and optional issue URL
   */
  submit: (data: FeedbackSubmitDTO, token?: string | null): Promise<FeedbackResponseDTO> =>
    fetchApi<FeedbackResponseDTO>(
      "/api/feedback",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    ),
};
