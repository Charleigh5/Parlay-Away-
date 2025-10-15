import React from 'react';
import Hero from '../components/dashboard/Hero';
import EdgeTicker from '../components/dashboard/EdgeTicker';
import EdgeMeter from '../components/dashboard/EdgeMeter';
import LeaderboardWidget from '../components/dashboard/LeaderboardWidget';
import { useCelebration } from '../contexts/CelebrationProvider';
import { RefreshCwIcon } from '../assets/icons/RefreshCwIcon';

const DashboardPage: React.FC = () => {
    const { triggerHelmetCollision } = useCelebration();
    
    return (
        <div className="flex flex-col min-h-full" style={{ backgroundColor: 'hsl(var(--background))' }}>
            <EdgeTicker />
            <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-6">
                 <div className="flex justify-between items-start">
                    <div className="animate-fade-slide-in flex-1" style={{ animationDelay: '100ms', opacity: 0 }}>
                        <Hero />
                    </div>
                    <button 
                        onClick={triggerHelmetCollision}
                        className="ml-4 p-2 rounded-lg text-sm flex items-center gap-2"
                        style={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--muted-foreground))' }}
                        title="Simulate data refresh"
                    >
                        <RefreshCwIcon className="h-4 w-4" />
                        Refresh Data
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 animate-fade-slide-in" style={{ animationDelay: '200ms', opacity: 0 }}>
                        <EdgeMeter />
                    </div>
                    <div className="animate-fade-slide-in" style={{ animationDelay: '300ms', opacity: 0 }}>
                        <LeaderboardWidget />
                    </div>
                </div>
            </div>
        </div>
    );
}
export default DashboardPage;