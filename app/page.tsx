'use client';

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
}