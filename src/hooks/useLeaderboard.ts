import { useState, useEffect } from 'react';
import { LEADERBOARD_DATA } from '../data/mockLeaderboard';

type LeaderboardUser = typeof LEADERBOARD_DATA[0];

export const useLeaderboard = () => {
  const [data, setData] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (Math.random() > 0.95) {
            throw new Error("Could not connect to the community leaderboard.");
        }
        setData(LEADERBOARD_DATA);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, isLoading, error };
};
