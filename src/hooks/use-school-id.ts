
'use client';

import { useState, useEffect } from 'react';

export const SCHOOL_ID_LOCAL_STORAGE_KEY = 'campus-zm-school-id';

export function useSchoolId() {
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    // This effect runs only on the client side
    const storedSchoolId = localStorage.getItem(SCHOOL_ID_LOCAL_STORAGE_KEY);
    if (storedSchoolId) {
      setSchoolId(storedSchoolId);
    }

    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === SCHOOL_ID_LOCAL_STORAGE_KEY) {
            setSchoolId(event.newValue);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    }

  }, []);

  return schoolId;
}
