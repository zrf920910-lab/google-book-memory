import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get('book');
  const page = searchParams.get('page');
  const cover = searchParams.get('cover');

  if (!book) {
    return new NextResponse('Book identifier required', { status: 400 });
  }

  const booksDir = path.join(process.cwd(), 'books');
  const bookPath = path.join(booksDir, book);

  let filePath = '';
  if (cover === 'true') {
    const possible = ['cover.jpg', 'cover.jpeg', 'cover.png', 'cover.webp'];
    for (const f of possible) {
      const temp = path.join(bookPath, f);
      if (fs.existsSync(temp)) {
        filePath = temp;
        break;
      }
    }
  } else if (page) {
    filePath = path.join(bookPath, 'pages', page);
  }

  if (!filePath || !fs.existsSync(filePath)) {
    return new NextResponse('Asset not found', { status: 404 });
  }

  const fileBuffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'image/jpeg';
  if (ext === '.png') contentType = 'image/png';
  if (ext === '.webp') contentType = 'image/webp';

  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}