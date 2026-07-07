'use client';

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
}