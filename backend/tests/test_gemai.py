from dotenv import load_dotenv
from google import genai

# Load environment variables from .env file
load_dotenv()


def test_gemini_api():
    """Test that Gemini API is working."""
    client = genai.Client()
    response = client.models.generate_content(
        model="gemini-2.5-flash", contents="Explain how AI works in a few words"
    )
    print(response.text)
    assert response.text is not None