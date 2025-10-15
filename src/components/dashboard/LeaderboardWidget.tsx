import React, { useEffect } from 'react';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { TrophyIcon } from '../../assets/icons/TrophyIcon';
import FootballLoader from '../common/FootballLoader';
import { useCelebration } from '../../contexts/CelebrationProvider';

const LeaderboardWidget: React.FC = () => {
  const { data: leaderboardData, isLoading, error } = useLeaderboard();
  const { triggerEndZoneCelebration } = useCelebration();

  const currentUser = !isLoading && !error ? leaderboardData.find(u => u.isCurrentUser) : null;

  useEffect(() => {
    if (currentUser && currentUser.streak >= 7) {
      triggerEndZoneCelebration();
    }
  }, [currentUser, triggerEndZoneCelebration]);

  const SkeletonRow = () => (
    <div className="flex items-center justify-between p-2 rounded-md animate-pulse">
        <div className="flex items-center gap-3">
             <div className="h-4 w-6 rounded" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
             <div className="h-4 w-24 rounded" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
        </div>
        <div className="h-4 w-12 rounded" style={{ backgroundColor: 'hsl(var(--secondary))' }}></div>
    </div>
  );

  return (
    <div className="h-full rounded-xl p-6 flex flex-col" style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}>
      <h2 className="flex items-center gap-2 text-xl font-bold" style={{ color: 'hsl(var(--card-foreground))' }}>
        <TrophyIcon className="h-6 w-6 text-yellow-400" />
        Weekly Leaderboard
      </h2>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
            <div className="w-16">
                <FootballLoader />
            </div>
        </div>
      ) : error ? (
          <div className="flex items-center justify-center h-full text-center text-red-400 bg-red-900/50 rounded-md p-4">{error}</div>
      ) : (
        <>
            {currentUser && (
                <div className="my-4 grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Edge Streak</p>
                        <p className="text-2xl font-bold text-orange-400">{currentUser.streak}🔥</p>
                    </div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'hsl(var(--secondary))' }}>
                        <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>Weekly ROI</p>
                        <p className={`text-2xl font-bold ${currentUser.roi > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {currentUser.roi > 0 ? '+' : ''}{currentUser.roi.toFixed(1)}%
                        </p>
                    </div>
                </div>
            )}
            <div className="flex-1 space-y-2 overflow-y-auto">
                {leaderboardData.sort((a, b) => a.rank - b.rank).map(user => (
                <div key={user.rank} className="flex items-center justify-between p-2 rounded-md" style={{ backgroundColor: user.isCurrentUser ? 'hsla(var(--primary), 0.1)' : 'transparent' }}>
                    <div className="flex items-center gap-3">
                    <span className="font-mono text-sm w-6 text-center" style={{ color: 'hsl(var(--muted-foreground))' }}>{user.rank}</span>
                    <span className="font-semibold text-sm" style={{ color: user.isCurrentUser ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{user.name}</span>
                    </div>
                    <span className="font-mono text-sm" style={{ color: 'hsl(var(--foreground))' }}>{user.roi > 0 ? '+' : ''}{user.roi.toFixed(1)}%</span>
                </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardWidget;