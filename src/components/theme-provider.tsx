
'use client';

import { useEffect, useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';

type ThemeSettings = {
  primaryColor: { h: number; s: number; l: number };
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const settingsRef = ref(database, `schools/${user.uid}/settings/theme`);
      const unsubscribe = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const settings: ThemeSettings = snapshot.val();
          const { h, s, l } = settings.primaryColor;
          const primaryColor = `${h} ${s}% ${l}%`;
          // Also generate a darker color for the ring
          const ringColor = `${h} ${s}% ${Math.max(0, l - 10)}%`;

          document.documentElement.style.setProperty('--primary', primaryColor);
          document.documentElement.style.setProperty('--ring', ringColor);
        } else {
          // Reset to default if no theme is set
          document.documentElement.style.removeProperty('--primary');
          document.documentElement.style.removeProperty('--ring');
        }
      });
      return () => unsubscribe();
    } else {
        // Reset to default when logged out
        document.documentElement.style.removeProperty('--primary');
        document.documentElement.style.removeProperty('--ring');
    }
  }, [user]);

  return <>{children}</>;
}
