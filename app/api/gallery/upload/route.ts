import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // TODO: Verify the existing admin session here.
    // Reject unauthenticated requests before accepting uploads.

    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'Image file is required' },
        { status: 400 }
      );
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Use direct client upload for larger images' },
        { status: 413 }
      );
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPG, PNG and WebP are allowed' },
        { status: 400 }
      );
    }

    const blob = await put(
      `gallery/${crypto.randomUUID()}`,
      file,
      {
        access: 'public',
        addRandomSuffix: true,
      }
    );

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error('Gallery upload failed:', error);

    return NextResponse.json(
      { error: 'Image upload failed' },
      { status: 500 }
    );
  }
}