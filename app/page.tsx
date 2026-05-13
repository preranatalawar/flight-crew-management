'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await api.get('/api/auth/me');
        if (!cancelled) {
          router.replace('/dashboard');
        }
      } catch {
        if (!cancelled) {
          router.replace('/login');
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
