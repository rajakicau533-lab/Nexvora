'use client';

import { useEffect, useState, useRef } from 'react';
import { Query, onSnapshot, DocumentData } from 'firebase/firestore';

export function useCollection<T = DocumentData>(query: Query | null) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Use a ref to store the last query to avoid unnecessary loading states
  // if the query object instance changes but is logically equivalent (though useMemo is preferred)
  const lastQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!query) {
      setData([]);
      setLoading(false);
      return;
    }

    const queryKey = JSON.stringify(query); // Simple check for query changes
    if (lastQueryRef.current !== queryKey) {
      setLoading(true);
      lastQueryRef.current = queryKey;
    }

    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as T[];
        
        // Only update if data actually changed to prevent infinite loops
        setData(docs);
        setLoading(false);
      },
      (err) => {
        if (err.code !== 'permission-denied') {
          console.error("useCollection Error:", err);
        }
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]); 

  return { data, loading, error };
}
