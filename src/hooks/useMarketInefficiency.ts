import { useState, useEffect } from 'react';

export const useMarketInefficiency = () => {
  const [value, setValue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
         if (Math.random() > 0.95) {
          throw new Error("Market inefficiency feed is temporarily unavailable.");
        }
        setValue(0.78);
      } catch (err) {
         setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { value, isLoading, error };
};
