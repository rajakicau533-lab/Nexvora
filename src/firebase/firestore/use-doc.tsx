'use client';

import { useEffect, useState } from 'react';
import { DocumentReference, onSnapshot } from 'firebase/firestore';

export function useDoc<T = any>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    // Reset loading state whenever the ref changes
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        setData(doc.exists() ? ({ ...doc.data(), id: doc.id } as T) : null);
        setLoading(false);
      },
      (err) => {
        console.error("useDoc Error:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref?.path]);

  return { data, loading, error };
}
