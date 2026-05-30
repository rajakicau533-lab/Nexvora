
'use client';

import { useEffect, useState } from 'react';
import { DocumentReference, onSnapshot } from 'firebase/firestore';

export function useDoc<T = any>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Using ref.path in the dependency array is more stable than the ref object itself
  const path = ref?.path;

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        setData(doc.exists() ? ({ ...doc.data(), id: doc.id } as T) : null);
        setLoading(false);
      },
      (err) => {
        if (err.code !== 'permission-denied') {
          console.error("useDoc Error:", err);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [path]); // Dependency on the path string is more reliable

  return { data, loading, error };
}
