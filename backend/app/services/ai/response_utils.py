"""Shared Gemini response parsing utilities for AI services."""

from typing import Optional


def extract_text_from_response(response) -> Optional[str]:
    """Extract the first text part from a Gemini API response.

    Walks the response candidates/parts structure and returns the first
    non-empty text value found.

    Args:
        response: A Gemini GenerateContentResponse object.

    Returns:
        The extracted text string, or None if no text was found.
    """
    if not response or not response.candidates:
        return None

    for candidate in response.candidates:
        if not candidate.content or not candidate.content.parts:
            continue
        for part in candidate.content.parts:
            if hasattr(part, "text") and part.text:
                return part.text.strip()

    return None


def extract_image_data(response) -> Optional[str]:
    """Extract base64 image data from a Gemini API response.

    Args:
        response: A Gemini GenerateContentResponse object.

    Returns:
        Base64-encoded image string, or None if no image was found.
    """
    import base64

    if not response or not response.candidates:
        return None

    for candidate in response.candidates:
        if not candidate.content or not candidate.content.parts:
            continue
        for part in candidate.content.parts:
            if hasattr(part, "inline_data") and part.inline_data:
                image_data = part.inline_data.data
                if isinstance(image_data, bytes):
                    image_data = base64.b64encode(image_data).decode("utf-8")
                return image_data

    return None
