"""GitHub issue creation service for user feedback."""

import logging
import os
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

CATEGORY_TO_LABEL = {
    "Bug Report": "bug",
    "Feature Request": "enhancement",
    "General Feedback": "feedback",
    "Question": "question",
}


class GitHubIssueError(Exception):
    """Raised when GitHub issue creation fails."""

    pass


class GitHubService:
    """Creates GitHub issues from user feedback submissions."""

    def __init__(self) -> None:
        self.token = os.getenv("GITHUB_TOKEN", "")
        self.repo = os.getenv("GITHUB_REPO", "")

    @property
    def _configured(self) -> bool:
        return bool(self.token and self.repo)

    def create_issue(
        self,
        category: str,
        message: str,
        user_email: str,
        metadata: Optional[dict] = None,
    ) -> Optional[str]:
        """
        Create a GitHub issue from user feedback.

        Returns the issue URL on success, or None if GitHub is not configured.

        Raises:
            GitHubIssueError: If the API call fails.
        """
        if not self._configured:
            logger.warning("GITHUB_TOKEN or GITHUB_REPO not set — skipping issue creation")
            return None

        label = CATEGORY_TO_LABEL.get(category, "feedback")
        title = f"[{category}] {message[:80]}"

        body_parts = [
            f"**Category:** {category}",
            f"**Submitted by:** {user_email}",
            "",
            "---",
            "",
            message,
        ]

        if metadata:
            body_parts.extend(["", "---", "", "**Context:**"])
            for key, value in metadata.items():
                if value is not None:
                    body_parts.append(f"- **{key}:** {value}")

        body = "\n".join(body_parts)

        try:
            resp = httpx.post(
                f"https://api.github.com/repos/{self.repo}/issues",
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                json={
                    "title": title,
                    "body": body,
                    "labels": [label, "user-feedback"],
                },
                timeout=10.0,
            )
            resp.raise_for_status()
            return resp.json()["html_url"]
        except httpx.HTTPStatusError as e:
            logger.error("GitHub API error %s: %s", e.response.status_code, e.response.text)
            raise GitHubIssueError(f"GitHub API returned {e.response.status_code}") from e
        except httpx.HTTPError as e:
            logger.error("GitHub API request failed: %s", e)
            raise GitHubIssueError("Failed to reach GitHub API") from e
