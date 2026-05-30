
'use client';

import { useEffect, useState } from 'react';
import { Query, onSnapshot, DocumentData } from 'firebase/firestore';

export function useCollection<T = DocumentData>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    // Set loading only if we're not already loading to help prevent unnecessary re-renders
    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        setData(docs);
        setLoading(false);
      },
      (err) => {
        // Only log errors if they aren't common permission denials during auth transitions
        if (err.code !== 'permission-denied') {
          console.error("useCollection Error:", err);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]); // Identity stability of query is critical here

  return { data, loading, error };
}
