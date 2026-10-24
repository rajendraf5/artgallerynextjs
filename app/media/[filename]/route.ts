import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { uploadDirectory } from "@/lib/gallery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const imageTypes: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;
  const extension = path.extname(filename).slice(1).toLowerCase();
  if (path.basename(filename) !== filename || !imageTypes[extension]) {
    return new NextResponse("Not found", { status: 404 });
  }
  try {
    const image = await readFile(path.join(uploadDirectory, filename));
    return new NextResponse(image, {
      headers: {
        "Content-Type": imageTypes[extension],
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return new NextResponse("Not found", { status: 404 });
    }
    console.error("Could not read gallery image.", error);
    return new NextResponse("Image unavailable", { status: 500 });
  }
}
