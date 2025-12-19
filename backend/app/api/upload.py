"""Upload API endpoints for image handling via Cloudinary."""

import os
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

router = APIRouter()


@router.post("")
async def upload_recipe_image(
    file: UploadFile = File(...),
    recipeId: str = Form(...),
    imageType: str = Form(default="reference")
):
    """
    Upload a recipe image to Cloudinary.

    Args:
        file: The image file to upload
        recipeId: The recipe ID (used for organizing/naming)
        imageType: Either "reference" (thumbnail) or "banner" (hero image)

    Returns:
        success: Whether upload succeeded
        path: The Cloudinary URL for the image
        filename: The public ID of the uploaded image
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Validate imageType
    if imageType not in ("reference", "banner"):
        imageType = "reference"

    try:
        # Read file contents
        contents = await file.read()

        # Upload to Cloudinary with recipe-specific folder structure
        result = cloudinary.uploader.upload(
            contents,
            folder=f"meal-genie/recipes/{recipeId}",
            public_id=f"{imageType}_{recipeId}",
            overwrite=True,
            resource_type="image",
            transformation=[
                {"quality": "auto:good"},
                {"fetch_format": "auto"}
            ]
        )

        return {
            "success": True,
            "path": result["secure_url"],
            "filename": result["public_id"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.delete("/{public_id:path}")
async def delete_recipe_image(public_id: str):
    """
    Delete an image from Cloudinary.

    Args:
        public_id: The Cloudinary public ID of the image to delete
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        return {"success": result.get("result") == "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")
