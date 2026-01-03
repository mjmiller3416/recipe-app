"""Feedback service for submitting user feedback to GitHub Issues."""

import os
from datetime import datetime
import httpx

from app.dtos.feedback import FeedbackCreateDTO, FeedbackResponseDTO


# Map feedback categories to GitHub issue labels
CATEGORY_LABEL_MAP = {
    "Feature Request": "enhancement",
    "Bug Report": "bug",
    "General Feedback": "feedback",
    "Question": "question",
}


class FeedbackService:
    """Service for handling user feedback submission to GitHub."""

    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.github_repo = os.getenv("GITHUB_REPO")

    def _is_configured(self) -> bool:
        """Check if GitHub integration is properly configured."""
        return bool(self.github_token and self.github_repo)

    async def submit_feedback(self, feedback: FeedbackCreateDTO) -> FeedbackResponseDTO:
        """Submit feedback as a GitHub issue."""
        if not self._is_configured():
            return FeedbackResponseDTO(
                success=False,
                message="Feedback submission is not configured. Please contact the administrator.",
            )

        # Build issue title and body
        title = f"[{feedback.category}] User Feedback"
        timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

        # Build metadata section if present
        metadata_section = ""
        if feedback.metadata:
            # Filter out None values and build formatted list
            metadata_items = [
                f"- **{key.replace('_', ' ').title()}:** {value}"
                for key, value in feedback.metadata.items()
                if value is not None
            ]
            if metadata_items:
                metadata_section = "\n### Context\n" + "\n".join(metadata_items) + "\n"

        body = f"""## User Feedback

**Category:** {feedback.category}
**Submitted:** {timestamp}
{metadata_section}
---

{feedback.message}

---
*This issue was automatically created from the Meal Genie feedback form.*
"""

        # Get the appropriate label
        label = CATEGORY_LABEL_MAP.get(feedback.category, "feedback")

        # Create the GitHub issue
        url = f"https://api.github.com/repos/{self.github_repo}/issues"
        headers = {
            "Authorization": f"Bearer {self.github_token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
        payload = {
            "title": title,
            "body": body,
            "labels": [label],
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, json=payload, headers=headers)

                if response.status_code == 201:
                    issue_data = response.json()
                    return FeedbackResponseDTO(
                        success=True,
                        issue_url=issue_data.get("html_url"),
                        message="Thank you for your feedback! It has been submitted successfully.",
                    )
                else:
                    error_detail = response.json().get("message", "Unknown error")
                    return FeedbackResponseDTO(
                        success=False,
                        message=f"Failed to submit feedback: {error_detail}",
                    )
        except httpx.RequestError as e:
            return FeedbackResponseDTO(
                success=False,
                message=f"Network error while submitting feedback: {str(e)}",
            )
