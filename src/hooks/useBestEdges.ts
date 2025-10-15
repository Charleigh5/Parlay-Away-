import { useState, useEffect } from 'react';
import { BEST_EDGES } from '../data/mockBestEdges';

type Edge = typeof BEST_EDGES[0];

// Fisher-Yates shuffle algorithm
const shuffleArray = (array: Edge[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export const useBestEdges = () => {
  const [data, setData] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        await new Promise(resolve => setTimeout(resolve, 1200));
        if (Math.random() > 0.95) {
          throw new Error("Failed to fetch best edges from the market data stream.");
        }
        setData(BEST_EDGES);
        setDataVersion(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Simulate live data updates every 5 seconds after initial load
  useEffect(() => {
    if (isLoading || error) return;

    const intervalId = setInterval(() => {
      setData(prevData => shuffleArray([...prevData]));
      setDataVersion(v => v + 1);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isLoading, error]);

  return { data, isLoading, error, dataVersion };
};