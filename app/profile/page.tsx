'use client';

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
}