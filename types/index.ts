export interface DBChild {
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
}