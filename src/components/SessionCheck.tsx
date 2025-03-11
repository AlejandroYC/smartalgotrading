'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function SessionCheck() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      console.log('No user found in client, redirecting to login');
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return null;
} 