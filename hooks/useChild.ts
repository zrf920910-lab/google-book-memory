import { useEffect, useState } from 'react';
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
      return `${months}个月`;
    }
    return `${years}岁${months}个月`;
  };

  return {
    child,
    loading,
    saveChildProfile,
    ageDisplay: child ? getAgeDisplay() : '',
    getAgeDisplay,
  };
}