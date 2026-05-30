'use client';

import { useEffect, useState, useRef } from 'react';
import { DocumentReference, onSnapshot } from 'firebase/firestore';

export function useDoc<T = any>(ref: DocumentReference | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const lastPathRef = useRef<string | null>(null);

  const path = ref?.path;

  useEffect(() => {
    if (!ref) {
      setData(null);
      setLoading(false);
      return;
    }

    if (lastPathRef.current !== path) {
      setLoading(true);
      lastPathRef.current = path || null;
    }

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
  }, [path, ref]);

  return { data, loading, error };
}
