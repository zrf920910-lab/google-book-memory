'use client';

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
    a.download = `${vid.bookTitle}-${vid.childName}-${vid.childAge}.mp4`;
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
}