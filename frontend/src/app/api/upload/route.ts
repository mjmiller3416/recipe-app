import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// Directory where recipe images are stored
const UPLOAD_DIR = path.join(process.cwd(), "public", "images", "recipes");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const recipeId = formData.get("recipeId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!recipeId) {
      return NextResponse.json(
        { error: "No recipe ID provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Get file extension from mime type
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const extension = extMap[file.type] || "png";

    // Create filename based on recipe ID
    const filename = `${recipeId}.${extension}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Delete existing image for this recipe (could be different extension)
    const extensions = ["jpg", "jpeg", "png", "webp", "gif"];
    for (const ext of extensions) {
      const existingFile = path.join(UPLOAD_DIR, `${recipeId}.${ext}`);
      if (existsSync(existingFile)) {
        try {
          await unlink(existingFile);
        } catch {
          // Ignore errors when deleting old files
        }
      }
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the path relative to public directory (for use in img src)
    const imagePath = `/images/recipes/${filename}`;

    return NextResponse.json({
      success: true,
      path: imagePath,
      filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
