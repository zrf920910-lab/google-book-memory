'use client';

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
          id: `page_${Date.now()}_${idx}`,
          pageIndex: idx,
          imageBlob: blob
        }));
      } else if (imageFiles.length > 0) {
        setUploadProgress(30);
        const sortedFiles = [...imageFiles].sort((a, b) => a.name.localeCompare(b.name));
        for (let idx = 0; idx < sortedFiles.length; idx++) {
          const comp = await compressAndResizeImage(sortedFiles[idx]);
          pagesArray.push({
            id: `page_${Date.now()}_${idx}`,
            pageIndex: idx,
            imageBlob: comp
          });
          setUploadProgress(30 + Math.round((idx / sortedFiles.length) * 60));
        }
      }

      const newBook: LocalBook = {
        id: `custom_${Date.now()}`,
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
          className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'built-in' ? 'bg-[#faf8f5] text-[#3a332e] shadow-sm' : 'text-[#8c7e6b]'
          }`}
        >
          <Library className="w-3.5 h-3.5" /> 内置经典
        </button>
        <button
          onClick={() => setTab('my-books')}
          className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            tab === 'my-books' ? 'bg-[#faf8f5] text-[#3a332e] shadow-sm' : 'text-[#8c7e6b]'
          }`}
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
              <Link href={`/books/${b.id}`} key={b.id} className="group block space-y-2">
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
                <Link href={`/books/${b.id}`} key={b.id} className="group block space-y-2 relative">
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
                          className={`h-full rounded-lg text-[9px] font-bold transition-all flex flex-col justify-center items-center ${
                            !pdfFile && imageFiles.length === 0 ? 'bg-[#efece6] text-[#3a332e]' : 'text-[#8c7e6b]'
                          }`}
                        >
                          <Plus className="w-3 h-3 mb-0.5" /> 图片
                        </button>
                        <label className={`h-full rounded-lg text-[9px] font-bold transition-all flex flex-col justify-center items-center cursor-pointer ${
                          pdfFile ? 'bg-[#efece6] text-[#3a332e]' : 'text-[#8c7e6b]'
                        }`}>
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
                          {imageFiles.length > 0 ? `已选择 ${imageFiles.length} 张图片` : '可按顺序一次性框选多张图片'}
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
}