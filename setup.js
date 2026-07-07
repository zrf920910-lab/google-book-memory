const fs = require('fs');
const path = require('path');

// 定义项目文件及其完整内容
const files = {
  // Package definitions
  'package.json': `{
  "name": "book-memory",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "19.0.0-rc-66855b9609-20241106",
    "react-dom": "19.0.0-rc-66855b9609-20241106",
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "lucide-react": "^0.456.0",
    "framer-motion": "^11.11.11",
    "@ducanh2912/next-pwa": "^10.2.9",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.4",
    "@prisma/client": "^5.22.0"
  },
  "devDependencies": {
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "prisma": "^5.22.0"
  }
}`,

  'tsconfig.json': `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}`,

  'tailwind.config.ts': `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};
export default config;`,

  'postcss.config.mjs': `const config = {
  plugins: {
    tailwindcss: {},
  },
};
export default config;`,

  'next.config.ts': `import { NextConfig } from 'next';
import withPWAPackage from '@ducanh2912/next-pwa';

const withPWA = withPWAPackage({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default withPWA(nextConfig);`,

  // Prisma Configuration
  'prisma/schema.prisma': `datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Child {
  id        String   @id @default(uuid())
  name      String
  birthday  DateTime
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Book {
  id          String     @id @default(uuid())
  title       String
  author      String?
  coverUrl    String
  isBuiltIn   Boolean    @default(false)
  directory   String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  pages       BookPage[]
  userBooks   UserBook[]
}

model BookPage {
  id        String   @id @default(uuid())
  bookId    String
  pageIndex Int
  imageUrl  String
  createdAt DateTime @default(now())
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
}

model Recording {
  id        String             @id @default(uuid())
  bookId    String
  pageIndex Int
  createdAt DateTime           @default(now())
  versions  RecordingVersion[]
}

model RecordingVersion {
  id          String   @id @default(uuid())
  recordingId String
  role        String
  audioBlobId String
  duration    Float
  createdAt   DateTime @default(now())
  recording   Recording @relation(fields: [recordingId], references: [id], onDelete: Cascade)
}

model Video {
  id        String   @id @default(uuid())
  bookId    String
  title     String
  fileId    String
  coverId   String
  duration  Float
  createdAt DateTime @default(now())
}

model Timeline {
  id          String   @id @default(uuid())
  date        DateTime @default(now())
  ageDisplay  String
  title       String
  description String
  type        String
  createdAt   DateTime @default(now())
}

model UserBook {
  id        String   @id @default(uuid())
  bookId    String
  progress  Int      @default(0)
  updatedAt DateTime @updatedAt
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
}

model Settings {
  id        String @id @default("global")
  language  String @default("zh-CN")
  theme     String @default("warm")
  bgMusic   String @default("none")
  bgVolume  Float  @default(0.2)
}`,

  // Core Utilities and Local Database Context
  'lib/db.ts': `export interface LocalChild {
  id: string;
  name: string;
  birthday: string;
  avatar?: string;
}

export interface LocalBookPage {
  id: string;
  pageIndex: number;
  imageBlob?: Blob;
  imageUrl?: string;
}

export interface LocalBook {
  id: string;
  title: string;
  author: string;
  coverBlob?: Blob;
  coverUrl?: string;
  isBuiltIn: boolean;
  pages: LocalBookPage[];
  createdAt: number;
}

export interface LocalRecording {
  id: string;
  bookId: string;
  pageIndex: number;
  role: 'child' | 'father' | 'mother' | 'family';
  audioBlob: Blob;
  duration: number;
  createdAt: number;
}

export interface LocalVideo {
  id: string;
  bookId: string;
  bookTitle: string;
  videoBlob: Blob;
  coverBlob: Blob;
  childName: string;
  childAge: string;
  dateStr: string;
  duration: number;
  createdAt: number;
}

export interface LocalTimeline {
  id: string;
  date: number;
  ageDisplay: string;
  title: string;
  description: string;
  type: 'recording' | 'export' | 'milestone';
  bookId?: string;
  createdAt: number;
}

class BookMemoryDB {
  private dbName = 'BookMemoryDB_v1';
  private version = 1;

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('IndexedDB is only accessible on the client side.'));
        return;
      }
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('child')) {
          db.createObjectStore('child', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('books')) {
          db.createObjectStore('books', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('recordings')) {
          db.createObjectStore('recordings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('videos')) {
          db.createObjectStore('videos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('timeline')) {
          db.createObjectStore('timeline', { keyPath: 'id' });
        }
      };
    });
  }

  async getChild(): Promise<LocalChild | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('child', 'readonly');
      const store = transaction.objectStore('child');
      const request = store.getAll();
      request.onsuccess = () => {
        resolve(request.result.length > 0 ? request.result[0] : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveChild(child: LocalChild): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('child', 'readwrite');
      const store = transaction.objectStore('child');
      const request = store.put(child);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getBooks(): Promise<LocalBook[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readonly');
      const store = transaction.objectStore('books');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getBook(id: string): Promise<LocalBook | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readonly');
      const store = transaction.objectStore('books');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveBook(book: LocalBook): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readwrite');
      const store = transaction.objectStore('books');
      const request = store.put(book);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBook(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('books', 'readwrite');
      const store = transaction.objectStore('books');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getRecordingsForBook(bookId: string): Promise<LocalRecording[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('recordings', 'readonly');
      const store = transaction.objectStore('recordings');
      const request = store.getAll();
      request.onsuccess = () => {
        const all = request.result as LocalRecording[];
        resolve(bookId ? all.filter((r) => r.bookId === bookId) : all);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveRecording(recording: LocalRecording): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('recordings', 'readwrite');
      const store = transaction.objectStore('recordings');
      const request = store.put(recording);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteRecording(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('recordings', 'readwrite');
      const store = transaction.objectStore('recordings');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getVideos(): Promise<LocalVideo[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('videos', 'readonly');
      const store = transaction.objectStore('videos');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async saveVideo(video: LocalVideo): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('videos', 'readwrite');
      const store = transaction.objectStore('videos');
      const request = store.put(video);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVideo(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('videos', 'readwrite');
      const store = transaction.objectStore('videos');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTimeline(): Promise<LocalTimeline[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('timeline', 'readonly');
      const store = transaction.objectStore('timeline');
      const request = store.getAll();
      request.onsuccess = () => {
        const sorted = (request.result || []).sort((a, b) => b.date - a.date);
        resolve(sorted);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async addTimelineEvent(event: LocalTimeline): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('timeline', 'readwrite');
      const store = transaction.objectStore('timeline');
      const request = store.put(event);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const localDB = new BookMemoryDB();`,

  'lib/audio.ts': `export class WebAudioEnhancer {
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lowpassNode: BiquadFilterNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private destinationNode: MediaStreamAudioDestinationNode | null = null;

  constructor(private stream: MediaStream) {}

  init() {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);

    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = 'highpass';
    this.filterNode.frequency.setValueAtTime(85, this.audioContext.currentTime);

    this.lowpassNode = this.audioContext.createBiquadFilter();
    this.lowpassNode.type = 'lowpass';
    this.lowpassNode.frequency.setValueAtTime(8000, this.audioContext.currentTime);

    this.compressorNode = this.audioContext.createDynamicsCompressor();
    this.compressorNode.threshold.setValueAtTime(-22, this.audioContext.currentTime);
    this.compressorNode.knee.setValueAtTime(25, this.audioContext.currentTime);
    this.compressorNode.ratio.setValueAtTime(3.5, this.audioContext.currentTime);
    this.compressorNode.attack.setValueAtTime(0.005, this.audioContext.currentTime);
    this.compressorNode.release.setValueAtTime(0.20, this.audioContext.currentTime);

    this.sourceNode.connect(this.filterNode);
    this.filterNode.connect(this.lowpassNode);
    this.lowpassNode.connect(this.compressorNode);

    this.destinationNode = this.audioContext.createMediaStreamDestination();
    this.compressorNode.connect(this.destinationNode);
  }

  getEnhancedStream(): MediaStream {
    if (!this.destinationNode) {
      this.init();
    }
    return this.destinationNode ? this.destinationNode.stream : this.stream;
  }

  close() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}`,

  'lib/image.ts': `export async function compressAndResizeImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas rendering execution context initialization failed.'));
        return;
      }

      const MAX_SIDE = 1600;
      let width = img.width;
      let height = img.height;

      if (width > MAX_SIDE || height > MAX_SIDE) {
        if (width > height) {
          height = Math.round((height * MAX_SIDE) / width);
          width = MAX_SIDE;
        } else {
          width = Math.round((width * MAX_SIDE) / height);
          height = MAX_SIDE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Could not convert canvas stream into JPEG image blob.'));
          }
        },
        'image/jpeg',
        0.8
      );
    };
    img.onerror = () => reject(new Error('Specified image asset failed to load into rendering engine.'));
  });
}`,

  'lib/pdf.ts': `export async function splitPDFToImages(
  file: File,
  onProgress: (percent: number) => void
): Promise<Blob[]> {
  const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
  if (!pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        workerScript.onload = () => resolve();
        workerScript.onerror = () => reject(new Error('PDFJS local WebWorker dynamic configuration failed.'));
        document.head.appendChild(workerScript);
      };
      script.onerror = () => reject(new Error('PDFJS core rendering engine script load failed.'));
      document.head.appendChild(script);
    });
  }

  const globalPdfjs = (window as any)['pdfjs-dist/build/pdf'];
  globalPdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await globalPdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  const imageBlobs: Blob[] = [];

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvasContext: ctx, viewport }).promise;

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.8));
    if (blob) {
      imageBlobs.push(blob);
    }
    onProgress(Math.round((i / pageCount) * 100));
  }
  return imageBlobs;
}`,

  'lib/videoExporter.ts': `function createProceduralAudioNode(ctx: AudioContext, frequency: number, duration: number, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(dest);
  
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export async function exportStoryVideo(
  bookTitle: string,
  pages: { imageBlob?: Blob; imageUrl?: string }[],
  audioBlobs: { [pageIndex: number]: Blob },
  childName: string,
  childAge: string,
  bgMusicType: 'none' | 'piano' | 'musicbox' | 'forest' | 'rain',
  bgVolume: number,
  onProgress: (percent: number) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not establish Canvas 2D raster engine.');

  const stream = canvas.captureStream(30);
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioContextClass();
  const destAudio = audioCtx.createMediaStreamDestination();

  let bgOscInterval: NodeJS.Timeout | null = null;
  if (bgMusicType !== 'none') {
    const bgGain = audioCtx.createGain();
    bgGain.gain.setValueAtTime(bgVolume * 0.15, audioCtx.currentTime);
    bgGain.connect(destAudio);

    let step = 0;
    const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    bgOscInterval = setInterval(() => {
      const freq = melody[step % melody.length];
      createProceduralAudioNode(audioCtx, freq, 1.5, bgGain);
      step++;
    }, 1000);
  }

  const combinedStream = new MediaStream();
  combinedStream.addTrack(stream.getVideoTracks()[0]);
  if (destAudio.stream.getAudioTracks().length > 0) {
    combinedStream.addTrack(destAudio.stream.getAudioTracks()[0]);
  }

  const recordedChunks: Blob[] = [];
  const options = { mimeType: 'video/webm;codecs=vp9,opus' };
  let mediaRecorder: MediaRecorder;
  
  try {
    mediaRecorder = new MediaRecorder(combinedStream, options);
  } catch {
    mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
  }

  mediaRecorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  const loadImg = (url: string): Promise<HTMLImageElement> => {
    return new Promise((res, rej) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => res(img);
      img.onerror = () => rej(new Error(\`Image resource load failed: \${url}\`));
    });
  };

  const drawPage = (img: HTMLImageElement | null, titleStr: string, subtitleStr: string, textStr: string) => {
    ctx.fillStyle = '#faf8f5';
    ctx.fillRect(0, 0, 1080, 1080);

    ctx.strokeStyle = '#e6dec9';
    ctx.lineWidth = 16;
    ctx.strokeRect(40, 40, 1000, 1000);

    if (img) {
      const photoWidth = 840;
      const photoHeight = 630;
      const photoX = 120;
      const photoY = 120;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(photoX - 20, photoY - 20, photoWidth + 40, photoHeight + 80);
      ctx.strokeStyle = '#e6dec9';
      ctx.lineWidth = 1;
      ctx.strokeRect(photoX - 20, photoY - 20, photoWidth + 40, photoHeight + 80);

      const iw = img.width;
      const ih = img.height;
      const aspect = iw / ih;
      const targetAspect = photoWidth / photoHeight;
      let dw, dh, dx, dy;

      if (aspect > targetAspect) {
        dw = photoWidth;
        dh = photoWidth / aspect;
        dx = photoX;
        dy = photoY + (photoHeight - dh) / 2;
      } else {
        dh = photoHeight;
        dw = photoHeight * aspect;
        dx = photoX + (photoWidth - dw) / 2;
        dy = photoY;
      }

      ctx.drawImage(img, dx, dy, dw, dh);

      ctx.fillStyle = '#3a332e';
      ctx.font = 'italic bold 28px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(textStr, 540, 880);
    } else {
      ctx.fillStyle = '#3a332e';
      ctx.font = 'bold 56px "Georgia", serif';
      ctx.textAlign = 'center';
      ctx.fillText(titleStr, 540, 360);

      ctx.strokeStyle = '#8c7e6b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(340, 440);
      ctx.lineTo(740, 440);
      ctx.stroke();

      ctx.font = '36px "Georgia", serif';
      ctx.fillStyle = '#5c5246';
      ctx.fillText(subtitleStr, 540, 520);

      ctx.fillStyle = '#8c7e6b';
      ctx.font = '24px "Georgia", serif';
      const today = new Date();
      ctx.fillText(\`声音记录器 | \${today.getFullYear()}年\${today.getMonth() + 1}月\`, 540, 780);
    }
  };

  return new Promise<Blob>(async (resolve, reject) => {
    try {
      mediaRecorder.start();

      drawPage(null, \`《\${bookTitle}》\`, \`\${childName} (\${childAge})\`, '');
      let coverTimer = 0;
      const coverInterval = setInterval(() => {
        drawPage(null, \`《\${bookTitle}》\`, \`\${childName} (\${childAge})\`, '');
        coverTimer += 100;
        if (coverTimer >= 3500) {
          clearInterval(coverInterval);
          playPageSequence();
        }
      }, 100);

      const playPageSequence = async () => {
        for (let i = 0; i < pages.length; i++) {
          onProgress(Math.round(((i + 1) / pages.length) * 100));
          const page = pages[i];
          const imgUrl = page.imageBlob ? URL.createObjectURL(page.imageBlob) : page.imageUrl || '';
          const img = await loadImg(imgUrl);

          const voiceBlob = audioBlobs[i];
          let durationMs = 3000;

          let voiceSource: AudioBufferSourceNode | null = null;
          if (voiceBlob) {
            const arrayBuffer = await voiceBlob.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
            durationMs = Math.max(audioBuffer.duration * 1000 + 400, 3000);

            voiceSource = audioCtx.createBufferSource();
            voiceSource.buffer = audioBuffer;
            voiceSource.connect(destAudio);
            voiceSource.start();
          }

          let elapsed = 0;
          await new Promise<void>((frameResolve) => {
            const pageLoop = setInterval(() => {
              drawPage(img, '', '', \`第 \${i + 1} / \${pages.length} 页\`);
              elapsed += 100;
              if (elapsed >= durationMs) {
                clearInterval(pageLoop);
                frameResolve();
              }
            }, 100);
          });

          if (voiceSource) {
            voiceSource.stop();
          }
          if (page.imageBlob) {
            URL.revokeObjectURL(imgUrl);
          }
        }

        if (bgOscInterval) clearInterval(bgOscInterval);
        mediaRecorder.stop();
        
        mediaRecorder.onstop = () => {
          audioCtx.close();
          const finalBlob = new Blob(recordedChunks, { type: 'video/mp4' });
          resolve(finalBlob);
        };
      };
    } catch (e) {
      if (bgOscInterval) clearInterval(bgOscInterval);
      audioCtx.close();
      reject(e);
    }
  });
}`,

  'lib/utils.ts': `import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`,

  // App Configurations
  'app/manifest.ts': `import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '绘本伴读 Book Memory',
    short_name: '绘本伴读',
    description: '记录孩子成长声音的数字绘本相册',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf8f5',
    theme_color: '#faf8f5',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  };
}`,

  'types/index.ts': `export interface DBChild {
  id: string;
  name: string;
  birthday: string;
  avatar?: string;
}

export interface DBPage {
  id: string;
  pageIndex: number;
  imageUrl: string;
  imageBlob?: Blob;
}

export interface DBBook {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  coverBlob?: Blob;
  isBuiltIn: boolean;
  pages: DBPage[];
}`,

  // Custom Hooks
  'hooks/useChild.ts': `import { useEffect, useState } from 'react';
import { localDB, LocalChild } from '@/lib/db';

export function useChild() {
  const [child, setChild] = useState<LocalChild | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const stored = await localDB.getChild();
        setChild(stored);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveChildProfile = async (name: string, birthday: string, avatarBase64?: string) => {
    const updated: LocalChild = {
      id: child?.id || 'main-child',
      name,
      birthday,
      avatar: avatarBase64 || child?.avatar,
    };
    await localDB.saveChild(updated);
    setChild(updated);
  };

  const getAgeDisplay = (birthStr?: string): string => {
    const dateStr = birthStr || child?.birthday;
    if (!dateStr) return '';
    const birth = new Date(dateStr);
    const now = new Date();

    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years === 0) {
      return \`\${months}个月\`;
    }
    return \`\${years}岁\${months}个月\`;
  };

  return {
    child,
    loading,
    saveChildProfile,
    ageDisplay: child ? getAgeDisplay() : '',
    getAgeDisplay,
  };
}`,

  // Route Handler and Static Engine Asset Pipeline
  'app/api/books/route.ts': `import { NextResponse } from 'next/server';
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
              .filter(file => /\\.(jpg|jpeg|png|webp)$/i.test(file))
              .sort()
              .map((file, idx) => ({
                id: \`\${folder}_page_\${idx}\`,
                pageIndex: idx,
                imageUrl: \`/api/books/assets?book=\${encodeURIComponent(folder)}&page=\${encodeURIComponent(file)}\`
              }));
          }

          books.push({
            id: folder,
            title: config.title,
            author: config.author || '未知作者',
            coverUrl: \`/api/books/assets?book=\${encodeURIComponent(folder)}&cover=true\`,
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
}`,

  'app/api/books/assets/route.ts': `import { NextRequest, NextResponse } from 'next/server';
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
}`,

  // UI Components and Screen Layouts
  'components/BottomNav.tsx': `'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, FolderHeart, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const pathname = usePathname();

  const navs = [
    { label: '首页', href: '/', icon: Home },
    { label: '绘本', href: '/books', icon: BookOpen },
    { label: '作品', href: '/works', icon: FolderHeart },
    { label: '我的', href: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#faf8f5]/90 backdrop-blur-md border-t border-[#e6dec9] flex items-center justify-around px-4 z-50">
      {navs.map((n) => {
        const Icon = n.icon;
        const active = pathname === n.href;
        return (
          <Link
            key={n.href}
            href={n.href}
            className="flex flex-col items-center justify-center w-16 h-12 transition-all duration-200 active:scale-95"
          >
            <Icon
              className={cn(
                'w-5 h-5 mb-1 transition-colors duration-200',
                active ? 'text-[#8c7e6b] scale-105' : 'text-[#b0a596]'
              )}
            />
            <span
              className={cn(
                'text-xs font-medium tracking-wide transition-colors duration-200',
                active ? 'text-[#3a332e]' : 'text-[#b0a596]'
              )}
            >
              {n.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}`,

  'app/layout.tsx': `import type { Metadata, Viewport } from 'next';
import './globals.css';
import { BottomNav } from '@/components/BottomNav';

export const metadata: Metadata = {
  title: '绘本伴读 | Book Memory',
  description: '让每一本绘本，都成为成长的一段回忆',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '绘本伴读'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#faf8f5'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#faf8f5] text-[#3a332e] antialiased select-none pb-20 font-sans">
        <main className="max-w-md mx-auto min-h-screen bg-[#faf8f5] shadow-sm relative overflow-x-hidden flex flex-col">
          {children}
          <BottomNav />
        </main>
      </body>
    </html>
  );
}`,

  'app/globals.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    -webkit-tap-highlight-color: transparent;
  }
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    transform: scale(1.08);
    opacity: 0.9;
    box-shadow: 0 0 0 12px rgba(239, 68, 68, 0);
  }
}

.breathe-btn {
  animation: breathe 2s infinite ease-in-out;
}`,

  'app/page.tsx': `'use client';

import { useState, useEffect } from 'react';
import { useChild } from '@/hooks/useChild';
import { localDB, LocalVideo } from '@/lib/db';
import { Book, Compass, FileAudio, Film, Mic, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function Page() {
  const { child, loading, saveChildProfile, ageDisplay } = useChild();
  const [initName, setInitName] = useState('');
  const [initBirth, setInitBirth] = useState('');
  const [initAvatar, setInitAvatar] = useState('');
  
  const [recentVideos, setRecentVideos] = useState<LocalVideo[]>([]);
  const [totals, setTotals] = useState({ booksCount: 0, vidsCount: 0 });

  useEffect(() => {
    async function loadStats() {
      const vids = await localDB.getVideos();
      const bks = await localDB.getBooks();
      setRecentVideos(vids.slice(0, 2));
      setTotals({
        booksCount: bks.length,
        vidsCount: vids.length
      });
    }
    if (child) {
      loadStats();
    }
  }, [child]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setInitAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!initName || !initBirth) return;
    await saveChildProfile(initName, initBirth, initAvatar);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#faf8f5]">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full border-2 border-[#8c7e6b] border-t-transparent animate-spin mx-auto" />
          <p className="text-[#8c7e6b] text-sm tracking-widest font-light">正在开启记忆相册...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="flex-1 min-h-screen bg-[#faf8f5] flex flex-col justify-between px-8 py-16">
        <div className="my-auto space-y-12">
          <div className="space-y-6 text-center">
            <div className="w-16 h-16 rounded-3xl bg-[#efece6] flex items-center justify-center mx-auto shadow-sm">
              <Sparkles className="w-8 h-8 text-[#8c7e6b]" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold tracking-widest text-[#3a332e]">欢迎来到绘本伴读</h1>
              <p className="text-sm text-[#8c7e6b] leading-relaxed font-light">
                让每一本绘本，<br />
                都留下孩子成长时最真实的声音。
              </p>
            </div>
          </div>

          <div className="space-y-5 bg-[#ffffff] p-6 rounded-3xl border border-[#e6dec9] shadow-sm">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8c7e6b] tracking-wider">孩子小名</label>
              <input
                type="text"
                placeholder="例如：乐乐"
                className="w-full bg-[#faf8f5] border border-[#e6dec9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8c7e6b] text-[#3a332e]"
                value={initName}
                onChange={(e) => setInitName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#8c7e6b] tracking-wider">生日</label>
              <input
                type="date"
                className="w-full bg-[#faf8f5] border border-[#e6dec9] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#8c7e6b] text-[#3a332e]"
                value={initBirth}
                onChange={(e) => setInitBirth(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#8c7e6b] tracking-wider block">添加头像（可选）</label>
              <div className="flex items-center gap-4">
                {initAvatar ? (
                  <img src={initAvatar} className="w-12 h-12 rounded-full object-cover border border-[#e6dec9]" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#faf8f5] border border-dashed border-[#e6dec9]" />
                )}
                <input type="file" accept="image/*" id="avatar-up" className="hidden" onChange={handleAvatarChange} />
                <label htmlFor="avatar-up" className="text-xs bg-[#efece6] text-[#5c5246] px-3 py-2 rounded-lg cursor-pointer hover:bg-[#e6dec9] transition-colors">
                  上传图片
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          disabled={!initName || !initBirth}
          onClick={handleCreate}
          className="w-full py-4 bg-[#3a332e] text-[#faf8f5] font-semibold text-sm rounded-2xl tracking-widest hover:bg-[#5c5246] transition-colors disabled:opacity-40"
        >
          开始记录
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs text-[#8c7e6b] font-medium tracking-widest">DIGITAL VOICE MEMORY</p>
          <h2 className="text-xl font-bold text-[#3a332e] flex items-center gap-2">
            {child.name} <span className="text-xs font-normal text-[#8c7e6b] bg-[#efece6] px-2 py-0.5 rounded-full">{ageDisplay}</span>
          </h2>
        </div>
        {child.avatar ? (
          <img src={child.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-[#e6dec9]" alt="avatar" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#efece6] flex items-center justify-center text-sm font-bold text-[#8c7e6b]">
            {child.name.slice(0, 1)}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-tr from-[#fdfbf7] to-[#f5f1e9] p-5 rounded-3xl border border-[#e6dec9] space-y-2 relative overflow-hidden">
        <div className="absolute right-4 bottom-4 opacity-5">
          <Sparkles className="w-24 h-24 text-[#8c7e6b]" />
        </div>
        <p className="text-xs font-semibold text-[#8c7e6b] tracking-widest">今日温暖</p>
        <p className="text-sm font-medium text-[#3a332e] leading-relaxed tracking-wider">
          “今天，也陪孩子读一本故事吧。”
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Link href="/books" className="p-4 bg-[#ffffff] border border-[#e6dec9] rounded-2xl flex items-center gap-3 shadow-sm hover:bg-[#faf8f5] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#fcf9f2] flex items-center justify-center">
            <Book className="w-5 h-5 text-[#8c7e6b]" />
          </div>
          <div className="text-left">
            <p className="text-xs text-[#8c7e6b]">绘本书架</p>
            <p className="text-xs font-bold text-[#3a332e]">{totals.booksCount} 本图书</p>
          </div>
        </Link>
        <Link href="/works" className="p-4 bg-[#ffffff] border border-[#e6dec9] rounded-2xl flex items-center gap-3 shadow-sm hover:bg-[#faf8f5] transition-colors">
          <div className="w-10 h-10 rounded-xl bg-[#f5f1e9] flex items-center justify-center">
            <Film className="w-5 h-5 text-[#8c7e6b]" />
          </div>
          <div className="text-left">
            <p className="text-xs text-[#8c7e6b]">影像作品</p>
            <p className="text-xs font-bold text-[#3a332e]">{totals.vidsCount} 个记录</p>
          </div>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#3a332e] tracking-widest">最近导出的记忆影像</h3>
          <Link href="/works" className="text-xs text-[#8c7e6b] font-medium hover:underline">查看全部</Link>
        </div>

        {recentVideos.length === 0 ? (
          <div className="border border-dashed border-[#e6dec9] rounded-3xl p-8 text-center space-y-3">
            <p className="text-xs text-[#8c7e6b] font-light leading-relaxed">
              尚无导出的视频作品。<br />
              进入绘本录制几页，即可生成属于你们的专属故事影片。
            </p>
            <Link href="/books" className="inline-flex items-center gap-1.5 text-xs bg-[#efece6] text-[#5c5246] px-4 py-2 rounded-xl font-medium">
              <Mic className="w-3.5 h-3.5" /> 开始录制
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentVideos.map((vid) => {
              const coverUrl = URL.createObjectURL(vid.coverBlob);
              return (
                <div key={vid.id} className="flex gap-4 p-3 bg-white border border-[#e6dec9] rounded-2xl items-center shadow-sm">
                  <img src={coverUrl} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-bold text-[#3a332e]">{vid.bookTitle}</p>
                    <p className="text-[10px] text-[#8c7e6b]">{vid.childAge} · {vid.dateStr}</p>
                  </div>
                  <Link href="/works" className="px-3 py-1.5 bg-[#efece6] text-xs font-medium text-[#5c5246] rounded-xl hover:bg-[#e6dec9] transition-colors">
                    播放
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#3a332e] tracking-widest">推荐亲子共读</h3>
        <div className="bg-[#ffffff] border border-[#e6dec9] p-4 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <p className="text-xs text-[#8c7e6b]">经典温馨之选</p>
            <p className="text-sm font-bold text-[#3a332e]">《猜猜我有多爱你》</p>
            <p className="text-xs text-[#8c7e6b] font-light leading-relaxed">让孩子在你的声音中感受无条件的爱与安全感。</p>
          </div>
          <Link href="/books" className="p-2 bg-[#faf8f5] hover:bg-[#efece6] border border-[#e6dec9] rounded-full transition-colors">
            <Compass className="w-5 h-5 text-[#8c7e6b]" />
          </Link>
        </div>
      </div>
    </div>
  );
}`,

  'app/books/page.tsx': `'use client';

import { useState, useEffect } from 'react';
import { localDB, LocalBook } from '@/lib/db';
import { splitPDFToImages } from '@/lib/pdf';
import { compressAndResizeImage } from '@/lib/image';
import { Plus, BookOpen, Trash2, Library, FileText, Check, Upload, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function BooksPage() {
  const [tab, setTab] = useState<'built-in' | 'my-books'>('built-in');
  const [builtInBooks, setBuiltInBooks] = useState<any[]>([]);
  const [customBooks, setCustomBooks] = useState<LocalBook[]>([]);
  const [loading, setLoading] = useState(true);

  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/books');
        const data = await res.json();
        setBuiltInBooks(data.books || []);

        const stored = await localDB.getBooks();
        setCustomBooks(stored);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCustomUpload = async () => {
    if (!bookTitle) return;
    setUploading(true);
    setUploadProgress(10);

    try {
      let finalCover: Blob | undefined = undefined;
      if (coverFile) {
        finalCover = await compressAndResizeImage(coverFile);
      }

      let pagesArray: { id: string; pageIndex: number; imageBlob: Blob }[] = [];

      if (pdfFile) {
        setUploadProgress(30);
        const splitBlobs = await splitPDFToImages(pdfFile, (p) => {
          setUploadProgress(30 + Math.round(p * 0.5));
        });
        pagesArray = splitBlobs.map((blob, idx) => ({
          id: \`page_\${Date.now()}_\${idx}\`,
          pageIndex: idx,
          imageBlob: blob
        }));
      } else if (imageFiles.length > 0) {
        setUploadProgress(30);
        const sortedFiles = [...imageFiles].sort((a, b) => a.name.localeCompare(b.name));
        for (let idx = 0; idx < sortedFiles.length; idx++) {
          const comp = await compressAndResizeImage(sortedFiles[idx]);
          pagesArray.push({
            id: \`page_\${Date.now()}_\${idx}\`,
            pageIndex: idx,
            imageBlob: comp
          });
          setUploadProgress(30 + Math.round((idx / sortedFiles.length) * 60));
        }
      }

      const newBook: LocalBook = {
        id: \`custom_\${Date.now()}\`,
        title: bookTitle,
        author: bookAuthor || '亲子手作',
        coverBlob: finalCover || pagesArray[0]?.imageBlob,
        isBuiltIn: false,
        pages: pagesArray,
        createdAt: Date.now()
      };

      await localDB.saveBook(newBook);
      setCustomBooks([newBook, ...customBooks]);
      
      setShowUpload(false);
      setBookTitle('');
      setBookAuthor('');
      setCoverFile(null);
      setPdfFile(null);
      setImageFiles([]);
    } catch (e) {
      console.error(e);
      alert('上传处理失败，请确认文件格式。');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteBook = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm('确认删除这本自定义绘本？该绘本下的所有语音片段都将被清空。')) {
      await localDB.deleteBook(id);
      setCustomBooks(customBooks.filter(b => b.id !== id));
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-xl font-bold text-[#3a332e] tracking-widest">绘本馆</h2>
          <p className="text-xs text-[#8c7e6b] font-light">指尖翻阅，留下亲子共读的纯真原音</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1 bg-[#3a332e] text-[#faf8f5] px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-[#5c5246] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> 上传绘本
        </button>
      </div>

      <div className="grid grid-cols-2 p-1 bg-[#efece6] rounded-xl border border-[#e6dec9]">
        <button
          onClick={() => setTab('built-in')}
          className={\`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 \${
            tab === 'built-in' ? 'bg-[#faf8f5] text-[#3a332e] shadow-sm' : 'text-[#8c7e6b]'
          }\`}
        >
          <Library className="w-3.5 h-3.5" /> 内置经典
        </button>
        <button
          onClick={() => setTab('my-books')}
          className={\`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 \${
            tab === 'my-books' ? 'bg-[#faf8f5] text-[#3a332e] shadow-sm' : 'text-[#8c7e6b]'
          }\`}
        >
          <BookOpen className="w-3.5 h-3.5" /> 导入自定义
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#8c7e6b] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {tab === 'built-in' ? (
            builtInBooks.map((b) => (
              <Link href={\`/books/\${b.id}\`} key={b.id} className="group block space-y-2">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#efece6] border border-[#e6dec9] relative shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                  <img src={b.coverUrl} className="w-full h-full object-cover" alt="Cover" />
                  <div className="absolute top-2 left-2 bg-black/35 backdrop-blur-sm text-white text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full">
                    内置
                  </div>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#3a332e] truncate">{b.title}</p>
                  <p className="text-[10px] text-[#8c7e6b] truncate">{b.author}</p>
                </div>
              </Link>
            ))
          ) : (
            customBooks.map((b) => {
              const coverUrl = b.coverBlob ? URL.createObjectURL(b.coverBlob) : b.coverUrl || '';
              return (
                <Link href={\`/books/\${b.id}\`} key={b.id} className="group block space-y-2 relative">
                  <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#efece6] border border-[#e6dec9] relative shadow-sm transition-transform duration-300 group-hover:-translate-y-1">
                    <img src={coverUrl} className="w-full h-full object-cover" alt="Cover" />
                    <button
                      onClick={(e) => deleteBook(b.id, e)}
                      className="absolute top-2 right-2 p-1.5 bg-white/75 backdrop-blur-sm rounded-full text-red-600 hover:text-red-800 hover:bg-white shadow transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#3a332e] truncate">{b.title}</p>
                    <p className="text-[10px] text-[#8c7e6b] truncate">{b.author}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}

      <AnimatePresence>
        {showUpload && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#faf8f5] w-full max-w-md rounded-t-[32px] p-6 border-t border-[#e6dec9] space-y-5 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#3a332e]">新建一本绘本</h3>
                <button onClick={() => setShowUpload(false)} className="text-xs text-[#8c7e6b] font-semibold hover:underline">关闭</button>
              </div>

              {uploading ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#8c7e6b] border-t-transparent animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#3a332e]">正在进行格式化转换与自动压缩...</p>
                    <p className="text-[10px] text-[#8c7e6b]">已完成 {uploadProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8c7e6b] uppercase tracking-wider">绘本名称</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[#e6dec9] rounded-xl px-4 py-3 text-xs text-[#3a332e] focus:outline-none focus:ring-1 focus:ring-[#8c7e6b]"
                      placeholder="绘本名字"
                      value={bookTitle}
                      onChange={(e) => setBookTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#8c7e6b] uppercase tracking-wider">作者 (可选)</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-[#e6dec9] rounded-xl px-4 py-3 text-xs text-[#3a332e] focus:outline-none focus:ring-1 focus:ring-[#8c7e6b]"
                      placeholder="原作者或由全家共创"
                      value={bookAuthor}
                      onChange={(e) => setBookAuthor(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8c7e6b] block uppercase tracking-wider">封面图</label>
                      <label className="border border-dashed border-[#e6dec9] rounded-xl p-3 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-[#efece6] transition-colors min-h-[96px]">
                        <Upload className="w-4 h-4 text-[#8c7e6b] mb-1" />
                        <span className="text-[10px] text-[#5c5246]">{coverFile ? '已选择' : '上传封面'}</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8c7e6b] block uppercase tracking-wider">上传格式</label>
                      <div className="grid grid-cols-2 gap-1 bg-white border border-[#e6dec9] rounded-xl p-1 h-[96px] items-center">
                        <button
                          type="button"
                          onClick={() => { setPdfFile(null); setImageFiles([]); }}
                          className={\`h-full rounded-lg text-[9px] font-bold transition-all flex flex-col justify-center items-center \${
                            !pdfFile && imageFiles.length === 0 ? 'bg-[#efece6] text-[#3a332e]' : 'text-[#8c7e6b]'
                          }\`}
                        >
                          <Plus className="w-3 h-3 mb-0.5" /> 图片
                        </button>
                        <label className={\`h-full rounded-lg text-[9px] font-bold transition-all flex flex-col justify-center items-center cursor-pointer \${
                          pdfFile ? 'bg-[#efece6] text-[#3a332e]' : 'text-[#8c7e6b]'
                        }\`}>
                          <FileText className="w-3 h-3 mb-0.5" /> PDF
                          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                            setPdfFile(e.target.files?.[0] || null);
                            setImageFiles([]);
                          }} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {!pdfFile && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-[#8c7e6b] block uppercase tracking-wider">多张内页图片</label>
                      <label className="w-full border border-dashed border-[#e6dec9] rounded-xl p-5 flex flex-col items-center justify-center bg-white cursor-pointer hover:bg-[#efece6] transition-colors">
                        <Upload className="w-5 h-5 text-[#8c7e6b] mb-1" />
                        <span className="text-xs text-[#5c5246]">
                          {imageFiles.length > 0 ? \`已选择 \${imageFiles.length} 张图片\` : '可按顺序一次性框选多张图片'}
                        </span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setImageFiles(files);
                        }} />
                      </label>
                    </div>
                  )}

                  {pdfFile && (
                    <div className="p-3 bg-[#efece6] border border-[#e6dec9] rounded-xl flex items-center justify-between text-xs text-[#5c5246]">
                      <span>已选中文档: {pdfFile.name}</span>
                      <button onClick={() => setPdfFile(null)} className="text-red-500 font-bold">移除</button>
                    </div>
                  )}

                  <button
                    onClick={handleCustomUpload}
                    disabled={!bookTitle || (!pdfFile && imageFiles.length === 0)}
                    className="w-full py-4 bg-[#3a332e] hover:bg-[#5c5246] text-white text-xs font-semibold rounded-2xl tracking-widest transition-colors disabled:opacity-40"
                  >
                    保存绘本并导入
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`,

  'app/books/[id]/page.tsx': `'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { localDB, LocalBook, LocalRecording, LocalTimeline } from '@/lib/db';
import { WebAudioEnhancer } from '@/lib/audio';
import { exportStoryVideo } from '@/lib/videoExporter';
import { useChild } from '@/hooks/useChild';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Play, Pause, Square, Mic, RefreshCw, Sparkles, Check, Music2, Volume2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookReaderPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { child, ageDisplay } = useChild();

  const [book, setBook] = useState<LocalBook | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordings, setRecordings] = useState<LocalRecording[]>([]);
  const [role, setRole] = useState<'child' | 'father' | 'mother' | 'family'>('child');
  const [recDuration, setRecDuration] = useState(0);

  const [volumeHeights, setVolumeHeights] = useState<number[]>(Array(18).fill(4));

  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const enhancerRef = useRef<WebAudioEnhancer | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);
  const [bgMusic, setBgMusic] = useState<'none' | 'piano' | 'musicbox' | 'forest' | 'rain'>('none');
  const [bgVolume, setBgVolume] = useState(0.2);

  useEffect(() => {
    async function loadBookData() {
      try {
        let selected: LocalBook | null = null;
        const res = await fetch('/api/books');
        const data = await res.json();
        const builtIn = data.books?.find((b: any) => b.id === id);

        if (builtIn) {
          selected = builtIn;
        } else {
          selected = await localDB.getBook(id);
        }

        if (selected) {
          setBook(selected);
          const recs = await localDB.getRecordingsForBook(id);
          setRecordings(recs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadBookData();
  }, [id]);

  const handlePageChange = (index: number) => {
    if (!book) return;
    if (index >= 0 && index < book.pages.length) {
      if (playingAudio) {
        audioRef.current?.pause();
        setPlayingAudio(false);
      }
      setCurrentPage(index);
    }
  };

  const currentRecording = recordings.find(
    (r) => r.pageIndex === currentPage && r.role === role
  );

  const startRecording = async () => {
    try {
      if (playingAudio) {
        audioRef.current?.pause();
        setPlayingAudio(false);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const enhancer = new WebAudioEnhancer(stream);
      enhancerRef.current = enhancer;
      const filteredStream = enhancer.getEnhancedStream();

      const options = { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(filteredStream, options);
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const finalBlob = new Blob(chunks, { type: 'audio/webm' });
        const newRec: LocalRecording = {
          id: \`\${id}_\${currentPage}_\${role}\`,
          bookId: id,
          pageIndex: currentPage,
          role,
          audioBlob: finalBlob,
          duration: recDuration,
          createdAt: Date.now(),
        };

        await localDB.saveRecording(newRec);
        setRecordings((prev) => {
          const index = prev.findIndex((r) => r.id === newRec.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = newRec;
            return updated;
          }
          return [...prev, newRec];
        });
      };

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      const source = ctx.createMediaStreamSource(filteredStream);
      source.connect(analyser);
      analyser.fftSize = 64;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      setRecDuration(0);
      setIsRecording(true);
      recorder.start();

      let seconds = 0;
      intervalRef.current = setInterval(() => {
        seconds += 1;
        setRecDuration(seconds);

        analyser.getByteFrequencyData(dataArray);
        const heights = Array.from(dataArray.slice(0, 18)).map((val) =>
          Math.max(4, Math.round((val / 255) * 36))
        );
        setVolumeHeights(heights);
      }, 100);
    } catch (e) {
      console.error(e);
      alert('无法开启录音设备。请确认麦克风使用权限。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      enhancerRef.current?.close();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRecording(false);
      setVolumeHeights(Array(18).fill(4));
    }
  };

  const playVoice = () => {
    if (!currentRecording) return;
    if (playingAudio) {
      audioRef.current?.pause();
      setPlayingAudio(false);
      return;
    }

    const url = URL.createObjectURL(currentRecording.audioBlob);
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => {
      setPlayingAudio(false);
      URL.revokeObjectURL(url);
    };
    audio.play();
    setPlayingAudio(true);
  };

  const handleExport = async () => {
    if (!book || !child) return;
    setExporting(true);
    setExportProgress(10);

    const mappedPages = book.pages.map((p) => {
      if (book.isBuiltIn) {
        return { imageUrl: p.imageUrl };
      }
      return { imageBlob: p.imageBlob };
    });

    const mappedAudio: { [idx: number]: Blob } = {};
    recordings.forEach((r) => {
      if (r.role === role) {
        mappedAudio[r.pageIndex] = r.audioBlob;
      }
    });

    try {
      const outputBlob = await exportStoryVideo(
        book.title,
        mappedPages,
        mappedAudio,
        child.name,
        ageDisplay || '未知年龄',
        bgMusic,
        bgVolume,
        (progress) => setExportProgress(progress)
      );

      const today = new Date();
      const filename = \`\${book.title}-\${child.name}-\${ageDisplay}.mp4\`;

      const coverBlob = book.pages[0]?.imageBlob || new Blob();

      await localDB.saveVideo({
        id: \`video_\${Date.now()}\`,
        bookId: book.id,
        bookTitle: book.title,
        videoBlob: outputBlob,
        coverBlob: coverBlob,
        childName: child.name,
        childAge: ageDisplay,
        dateStr: \`\${today.getFullYear()}年\${today.getMonth() + 1}月\`,
        duration: book.pages.length * 3.5,
        createdAt: Date.now(),
      });

      const totalRecs = recordings.filter((r) => r.role === role).length;
      await localDB.addTimelineEvent({
        id: \`tl_\${Date.now()}\`,
        date: Date.now(),
        ageDisplay: ageDisplay,
        title: \`录制并合成了《\${book.title}》\`,
        description: \`包含 \${totalRecs} 页精彩声音，配乐: \${bgMusic === 'none' ? '纯净声' : bgMusic}。\`,
        type: 'export',
        bookId: book.id,
        createdAt: Date.now(),
      });

      setExporting(false);
      setShowExportModal(false);
      router.push('/works');
    } catch (e) {
      console.error(e);
      alert('视频编译导出失败，由于设备内存限制，建议关闭其他标签页重新生成。');
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-[#faf8f5]">
        <div className="w-8 h-8 rounded-full border-2 border-[#8c7e6b] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm text-[#8c7e6b]">找不到指定的绘本文件。</p>
        <button onClick={() => router.push('/books')} className="text-xs bg-[#efece6] px-4 py-2 rounded-xl">返回书柜</button>
      </div>
    );
  }

  const currentPageImgUrl = book.pages[currentPage]?.imageBlob
    ? URL.createObjectURL(book.pages[currentPage].imageBlob!)
    : book.pages[currentPage]?.imageUrl || '';

  return (
    <div className="flex-1 flex flex-col justify-between min-h-screen pb-6">
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#e6dec9] bg-white">
        <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-[#efece6]">
          <ArrowLeft className="w-5 h-5 text-[#3a332e]" />
        </button>
        <span className="text-xs font-bold text-[#3a332e] max-w-[180px] truncate">《{book.title}》</span>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-1 bg-[#3a332e] text-[#faf8f5] px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-[#5c5246] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" /> 合成故事片
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-4 py-6 space-y-4">
        <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-[#e6dec9] shadow-sm relative">
          {currentPageImgUrl ? (
            <img src={currentPageImgUrl} className="w-full h-full object-contain" alt="Page View" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#8c7e6b] font-light">正在加载页面内页...</div>
          )}
          <div className="absolute top-3 right-3 px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full text-white text-[10px] font-semibold tracking-wider">
            {currentPage + 1} / {book.pages.length}
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8c7e6b] disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" /> 上一页
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === book.pages.length - 1}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#8c7e6b] disabled:opacity-30"
          >
            下一页 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[#ffffff] border-t border-[#e6dec9] px-6 py-6 space-y-5 rounded-t-[32px] shadow-sm">
        <div className="flex justify-between items-center bg-[#efece6] p-1 rounded-xl border border-[#e6dec9]">
          {([ 'child', 'father', 'mother', 'family' ] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                if (playingAudio) {
                  audioRef.current?.pause();
                  setPlayingAudio(false);
                }
                setRole(r);
              }}
              className={\`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all \${
                role === r ? 'bg-[#faf8f5] text-[#3a332e] shadow-xs' : 'text-[#8c7e6b]'
              }\`}
            >
              {r === 'child' && '宝宝读'}
              {r === 'father' && '爸爸读'}
              {r === 'mother' && '妈妈读'}
              {r === 'family' && '全家合读'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between h-16 bg-[#faf8f5] px-4 rounded-2xl border border-[#e6dec9]">
          {isRecording ? (
            <div className="flex items-center gap-3 flex-1">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
              <div className="flex items-end gap-[3px] flex-1 justify-center h-8">
                {volumeHeights.map((h, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ height: 4 }}
                    animate={{ height: h }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-1.5 bg-red-400 rounded-full"
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-[#3a332e] tabular-nums">{recDuration}s</span>
            </div>
          ) : currentRecording ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-xs font-medium text-[#3a332e]">当前页面已录制</span>
              </div>
              <button
                onClick={playVoice}
                className="flex items-center gap-1.5 text-xs font-bold text-[#8c7e6b] hover:underline"
              >
                {playingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {playingAudio ? '暂停播放' : '播放原声'}
              </button>
            </div>
          ) : (
            <div className="w-full text-center py-2">
              <p className="text-xs text-[#8c7e6b] font-light">
                本页未录制声音，轻按下方录音键开始。
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-8 py-2">
          {currentRecording && !isRecording && (
            <button
              onClick={startRecording}
              className="p-3 bg-[#efece6] text-[#5c5246] hover:bg-[#e6dec9] rounded-full transition-all active:scale-95 shadow-xs"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          )}

          {isRecording ? (
            <button
              onClick={stopRecording}
              className="w-20 h-20 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors breathe-btn"
            >
              <Square className="w-7 h-7 fill-white" />
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="w-20 h-20 bg-[#3a332e] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#5c5246] transition-all active:scale-95"
            >
              <Mic className="w-8 h-8 text-[#faf8f5]" />
            </button>
          )}

          <div className="w-11" />
        </div>
      </div>

      <AnimatePresence>
        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-[#faf8f5] w-full max-w-md rounded-t-[32px] p-6 border-t border-[#e6dec9] space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-[#3a332e]">影片合成配置</h3>
                <button onClick={() => setShowExportModal(false)} className="text-xs text-[#8c7e6b] font-semibold hover:underline">关闭</button>
              </div>

              {exporting ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#8c7e6b] border-t-transparent animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#3a332e]">拼合音频并执行自适应音视频帧封装...</p>
                    <p className="text-[10px] text-[#8c7e6b]">当前导出进度 {exportProgress}%</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#8c7e6b] block uppercase tracking-wider">选择环境声配乐</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {([ 'none', 'piano', 'musicbox', 'forest', 'rain' ] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setBgMusic(m)}
                          className={\`py-2 px-1 rounded-xl text-[9px] font-bold border transition-all \${
                            bgMusic === m
                              ? 'bg-[#3a332e] text-white border-transparent'
                              : 'bg-white text-[#8c7e6b] border-[#e6dec9]'
                          }\`}
                        >
                          {m === 'none' && '纯净声'}
                          {m === 'piano' && '轻钢琴'}
                          {m === 'musicbox' && '八音盒'}
                          {m === 'forest' && '森林'}
                          {m === 'rain' && '雨声'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {bgMusic !== 'none' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#8c7e6b] uppercase tracking-wider">
                        <span>配乐音量 (极弱，绝不盖住孩子声音)</span>
                        <span>{Math.round(bgVolume * 100)}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Volume2 className="w-4 h-4 text-[#8c7e6b]" />
                        <input
                          type="range"
                          min="0.05"
                          max="0.4"
                          step="0.05"
                          className="flex-1 accent-[#8c7e6b]"
                          value={bgVolume}
                          onChange={(e) => setBgVolume(parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="p-4 bg-white border border-[#e6dec9] rounded-2xl space-y-2">
                    <p className="text-[10px] font-bold text-[#8c7e6b] uppercase tracking-wider">首帧封签预览</p>
                    <div className="space-y-0.5 text-xs text-[#5c5246]">
                      <p>书名: 《{book.title}》</p>
                      <p>录音角色: {role === 'child' ? '宝宝' : role === 'father' ? '爸爸' : role === 'mother' ? '妈妈' : '全家'}</p>
                      <p>合订标签: {child?.name} ({ageDisplay})</p>
                    </div>
                  </div>

                  <button
                    onClick={handleExport}
                    className="w-full py-4 bg-[#3a332e] hover:bg-[#5c5246] text-white text-xs font-semibold rounded-2xl tracking-widest transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Music2 className="w-4 h-4" /> 开启本地安全多线程合成
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`,

  'app/works/page.tsx': `'use client';

import { useState, useEffect } from 'react';
import { localDB, LocalVideo } from '@/lib/db';
import { Film, Play, Download, Trash2, ArrowLeft, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorksPage() {
  const [videos, setVideos] = useState<LocalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<LocalVideo | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const stored = await localDB.getVideos();
        setVideos(stored);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确认永久删除这段珍贵的记忆影像？')) {
      await localDB.deleteVideo(id);
      setVideos(videos.filter((v) => v.id !== id));
      if (playingVideo?.id === id) {
        setPlayingVideo(null);
      }
    }
  };

  const handleDownload = (vid: LocalVideo, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = URL.createObjectURL(vid.videoBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`\${vid.bookTitle}-\${vid.childName}-\${vid.childAge}.mp4\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="space-y-0.5">
        <h2 className="text-xl font-bold text-[#3a332e] tracking-widest">成长影像集</h2>
        <p className="text-xs text-[#8c7e6b] font-light">每一幕都是一段有声音的时光印记</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 rounded-full border-2 border-[#8c7e6b] border-t-transparent animate-spin" />
        </div>
      ) : videos.length === 0 ? (
        <div className="border border-dashed border-[#e6dec9] rounded-3xl p-12 text-center space-y-4">
          <div className="w-12 h-12 bg-[#efece6] rounded-2xl flex items-center justify-center mx-auto">
            <Film className="w-6 h-6 text-[#8c7e6b]" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-[#3a332e]">尚无影像作品</p>
            <p className="text-[11px] text-[#8c7e6b] font-light leading-relaxed">
              当录制完一本绘本后，可在阅读页面右上角选择“合成故事片”，影片会自动呈现在此处。
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {videos.map((vid) => {
            const coverUrl = URL.createObjectURL(vid.coverBlob);
            return (
              <div
                key={vid.id}
                onClick={() => setPlayingVideo(vid)}
                className="group bg-white border border-[#e6dec9] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
              >
                <div className="aspect-video w-full bg-[#efece6] relative">
                  <img src={coverUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/15 flex items-center justify-center group-hover:bg-black/25 transition-all">
                    <div className="w-12 h-12 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow transition-transform duration-200 group-hover:scale-105">
                      <Play className="w-5 h-5 text-[#3a332e] fill-[#3a332e] ml-0.5" />
                    </div>
                  </div>
                </div>

                <div className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-[#3a332e]">《{vid.bookTitle}》</h3>
                    <p className="text-[10px] text-[#8c7e6b]">
                      {vid.childName} · {vid.childAge} · {vid.dateStr}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleDownload(vid, e)}
                      className="p-2 bg-[#efece6] hover:bg-[#e6dec9] rounded-xl text-[#5c5246] transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(vid, e)}
                      className="p-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {playingVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex flex-col justify-center p-4"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-[#faf8f5]">正在放映: 《{playingVideo.bookTitle}》</span>
              <button
                onClick={() => setPlayingVideo(null)}
                className="text-xs text-white/70 hover:text-white hover:underline"
              >
                退出放映
              </button>
            </div>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-lg">
              <video
                src={URL.createObjectURL(playingVideo.videoBlob)}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-center text-[10px] text-white/50 mt-4 tracking-wider">
              {playingVideo.childName} ({playingVideo.childAge}) 于 {playingVideo.dateStr} 声音合订本
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}`,

  'app/profile/page.tsx': `'use client';

import { useState, useEffect } from 'react';
import { useChild } from '@/hooks/useChild';
import { localDB, LocalTimeline } from '@/lib/db';
import { User, Calendar, BookOpen, Music, Film, Mic, Heart } from 'lucide-react';

export default function ProfilePage() {
  const { child, ageDisplay } = useChild();
  const [timeline, setTimeline] = useState<LocalTimeline[]>([]);
  const [stats, setStats] = useState({
    booksRecorded: 0,
    videosExported: 0,
    totalMinutes: 0,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const events = await localDB.getTimeline();
        setTimeline(events);

        const vids = await localDB.getVideos();
        const bks = await localDB.getBooks();
        
        let seconds = 0;
        const allRecs = await localDB.getRecordingsForBook('');
        allRecs.forEach((r) => { seconds += r.duration; });

        setStats({
          booksRecorded: bks.length,
          videosExported: vids.length,
          totalMinutes: Math.round(seconds / 60) || 1,
        });
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 p-6 space-y-8">
      <div className="flex items-center gap-5 bg-white border border-[#e6dec9] p-5 rounded-3xl shadow-sm">
        {child?.avatar ? (
          <img src={child.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-[#e6dec9]" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#efece6] flex items-center justify-center">
            <User className="w-8 h-8 text-[#8c7e6b]" />
          </div>
        )}
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-[#3a332e]">{child?.name || '小朋友'}</h2>
          <p className="text-xs text-[#8c7e6b]">{ageDisplay || '4岁2个月'}</p>
          <div className="flex items-center gap-1 text-[10px] text-[#8c7e6b]">
            <Calendar className="w-3.5 h-3.5" />
            生日: {child?.birthday}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#ffffff] border border-[#e6dec9] p-3 rounded-2xl text-center shadow-xs">
          <BookOpen className="w-4 h-4 text-[#8c7e6b] mx-auto mb-1" />
          <p className="text-[10px] text-[#8c7e6b]">已录图书</p>
          <p className="text-sm font-bold text-[#3a332e]">{stats.booksRecorded}</p>
        </div>
        <div className="bg-[#ffffff] border border-[#e6dec9] p-3 rounded-2xl text-center shadow-xs">
          <Mic className="w-4 h-4 text-[#8c7e6b] mx-auto mb-1" />
          <p className="text-[10px] text-[#8c7e6b]">录音时长</p>
          <p className="text-sm font-bold text-[#3a332e]">{stats.totalMinutes} 分钟</p>
        </div>
        <div className="bg-[#ffffff] border border-[#e6dec9] p-3 rounded-2xl text-center shadow-xs">
          <Film className="w-4 h-4 text-[#8c7e6b] mx-auto mb-1" />
          <p className="text-[10px] text-[#8c7e6b]">生成影片</p>
          <p className="text-sm font-bold text-[#3a332e]">{stats.videosExported}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-red-500 fill-red-500" />
          <h3 className="text-sm font-bold text-[#3a332e] tracking-widest">声音成长编年史</h3>
        </div>

        {timeline.length === 0 ? (
          <div className="border border-dashed border-[#e6dec9] rounded-3xl p-8 text-center">
            <p className="text-xs text-[#8c7e6b] font-light leading-relaxed">
              这里将自动生成你们的声音时间轴，记录孩子从奶声奶气到清晰流利的每一次蜕变。
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-[#e6dec9] ml-3 pl-5 py-2 space-y-6">
            {timeline.map((event) => {
              const date = new Date(event.date);
              return (
                <div key={event.id} className="relative group">
                  <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 bg-[#faf8f5] border-2 border-[#8c7e6b] rounded-full group-hover:scale-110 transition-all" />
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#8c7e6b] bg-[#efece6] px-2 py-0.5 rounded-full">
                        {event.ageDisplay}
                      </span>
                      <span className="text-[10px] text-[#8c7e6b] font-mono">
                        {date.getFullYear()}/{date.getMonth() + 1}/{date.getDate()}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#3a332e]">{event.title}</p>
                    <p className="text-[11px] text-[#8c7e6b] font-light leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}`,

  // Static Book assets mapping
  'books/猜猜我有多爱你/book.json': `{
  "title": "猜猜我有多爱你",
  "author": "山姆·麦克布雷尼"
}`
};

// 递归确保创建路径中的上级目录
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

console.log('正在自动初始化项目结构与写入文件...');

// 迭代文件映射并创建对应的物理文件
Object.keys(files).forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);
  ensureDirectoryExistence(fullPath);
  fs.writeFileSync(fullPath, files[filePath], 'utf8');
  console.log(`[已创建] ${filePath}`);
});

// 为内置绘本生成1像素的透明占位图像，确保系统资产文件加载时不抛异常
const tinyImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
const binaryImageBuffer = Buffer.from(tinyImageBase64, 'base64');

const coverPath = path.join(process.cwd(), 'books/猜猜我有多爱你/cover.jpg');
const pagePath = path.join(process.cwd(), 'books/猜猜我有多爱你/pages/001.jpg');

ensureDirectoryExistence(coverPath);
fs.writeFileSync(coverPath, binaryImageBuffer);

ensureDirectoryExistence(pagePath);
fs.writeFileSync(pagePath, binaryImageBuffer);

console.log('[已生成占位资产] cover.jpg 和 pages/001.jpg');
console.log('\n整个项目目录及代码已成功一键拉取就绪！请运行:');
console.log('1. npm install');
console.log('2. npx prisma generate');
console.log('3. npm run dev');