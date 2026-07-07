import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const booksDir = path.join(process.cwd(), 'books');
    if (!fs.existsSync(booksDir)) {
      return NextResponse.json({ books: [] });
    }

    const folders = fs.readdirSync(booksDir);
    const books = [];

    for (const folder of folders) {
      const folderPath = path.join(booksDir, folder);
      if (fs.statSync(folderPath).isDirectory()) {
        const configPath = path.join(folderPath, 'book.json');
        if (fs.existsSync(configPath)) {
          const configContent = fs.readFileSync(configPath, 'utf-8');
          const config = JSON.parse(configContent);
          
          const pagesDir = path.join(folderPath, 'pages');
          let pages: any[] = [];
          
          if (fs.existsSync(pagesDir)) {
            pages = fs.readdirSync(pagesDir)
              .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
              .sort()
              .map((file, idx) => ({
                id: `${folder}_page_${idx}`,
                pageIndex: idx,
                imageUrl: `/api/books/assets?book=${encodeURIComponent(folder)}&page=${encodeURIComponent(file)}`
              }));
          }

          books.push({
            id: folder,
            title: config.title,
            author: config.author || '未知作者',
            coverUrl: `/api/books/assets?book=${encodeURIComponent(folder)}&cover=true`,
            isBuiltIn: true,
            pages: pages
          });
        }
      }
    }

    return NextResponse.json({ books });
  } catch (err) {
    console.error('Core scan error:', err);
    return NextResponse.json({ error: 'System scanning error' }, { status: 500 });
  }
}