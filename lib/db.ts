export interface LocalChild {
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

export const localDB = new BookMemoryDB();