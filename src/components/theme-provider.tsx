
'use client';

import { useEffect, useState } from 'react';
import { auth, database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import { useSchoolId } from '@/hooks/use-school-id';

type ColorSettings = { h: number; s: number; l: number };
type ThemeSettings = {
  primaryColor: ColorSettings;
  backgroundColor: ColorSettings;
  secondaryColor: ColorSettings;
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const schoolId = useSchoolId();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const resetThemeToDefault = () => {
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--ring');
    document.documentElement.style.removeProperty('--background');
    document.documentElement.style.removeProperty('--secondary');
  };

  useEffect(() => {
    if (user && schoolId) {
      const settingsRef = ref(database, `schools/${schoolId}/settings/theme`);
      const unsubscribe = onValue(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const settings: ThemeSettings = snapshot.val();
          
          if (settings.primaryColor) {
            const { h, s, l } = settings.primaryColor;
            const primaryColor = `${h} ${s}% ${l}%`;
            const ringColor = `${h} ${s}% ${l}%`;
            document.documentElement.style.setProperty('--primary', primaryColor);
            document.documentElement.style.setProperty('--ring', ringColor);
          }

          if (settings.backgroundColor) {
            const { h, s, l } = settings.backgroundColor;
            document.documentElement.style.setProperty('--background', `${h} ${s}% ${l}%`);
          }

          if (settings.secondaryColor) {
            const { h, s, l } = settings.secondaryColor;
            document.documentElement.style.setProperty('--secondary', `${h} ${s}% ${l}%`);
          }

        } else {
          // Reset to default if no theme is set
          resetThemeToDefault();
        }
      });
      return () => unsubscribe();
    } else {
        // Reset to default when logged out or no schoolId
        resetThemeToDefault();
    }
  }, [user, schoolId]);

  return <>{children}</>;
}
