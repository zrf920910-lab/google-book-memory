'use client';

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
          id: `${id}_${currentPage}_${role}`,
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
      const filename = `${book.title}-${child.name}-${ageDisplay}.mp4`;

      const coverBlob = book.pages[0]?.imageBlob || new Blob();

      await localDB.saveVideo({
        id: `video_${Date.now()}`,
        bookId: book.id,
        bookTitle: book.title,
        videoBlob: outputBlob,
        coverBlob: coverBlob,
        childName: child.name,
        childAge: ageDisplay,
        dateStr: `${today.getFullYear()}年${today.getMonth() + 1}月`,
        duration: book.pages.length * 3.5,
        createdAt: Date.now(),
      });

      const totalRecs = recordings.filter((r) => r.role === role).length;
      await localDB.addTimelineEvent({
        id: `tl_${Date.now()}`,
        date: Date.now(),
        ageDisplay: ageDisplay,
        title: `录制并合成了《${book.title}》`,
        description: `包含 ${totalRecs} 页精彩声音，配乐: ${bgMusic === 'none' ? '纯净声' : bgMusic}。`,
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
              className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                role === r ? 'bg-[#faf8f5] text-[#3a332e] shadow-xs' : 'text-[#8c7e6b]'
              }`}
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
                          className={`py-2 px-1 rounded-xl text-[9px] font-bold border transition-all ${
                            bgMusic === m
                              ? 'bg-[#3a332e] text-white border-transparent'
                              : 'bg-white text-[#8c7e6b] border-[#e6dec9]'
                          }`}
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
}