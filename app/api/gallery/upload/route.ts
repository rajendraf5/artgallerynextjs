
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be 8 MB or smaller" },
        { status: 400 }
      );
    }

    const blob = await put(
      `gallery/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
      file,
      {
        access: "public",
        addRandomSuffix: false,
      }
    );

    return NextResponse.json({
      success: true,
      url: blob.url,
    });
  } catch (error) {
    console.error("Gallery upload failed:", error);

    return NextResponse.json(
      { error: "Image upload failed. Check Vercel Blob configuration." },
      { status: 500 }
    );
  }
}
