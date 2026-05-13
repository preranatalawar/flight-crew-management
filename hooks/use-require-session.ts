'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useRequireSession() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const { data } = await api.get<{ user: SessionUser }>('/api/auth/me');
        if (cancelled) return;
        setUser(data.user);
        try {
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch {
          /* ignore private mode / quota */
        }
      } catch {
        if (!cancelled) {
          router.replace('/login');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return { user, isLoading };
}
