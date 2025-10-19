import React, { ReactNode } from 'react';
import { Page } from '../../App';
import BottomNav from './BottomNav';
import ThemeToggle from '../common/ThemeToggle';
import { BrainCircuitIcon } from '../../assets/icons/BrainCircuitIcon';
import FAB from '../common/FAB';
import { useCelebration } from '../../contexts/CelebrationProvider';
import FieldGoalCelebration from '../animations/FieldGoalCelebration';
import LionsRoar from '../animations/LionsRoar';
import HelmetCollision from '../animations/HelmetCollision';
import EndZoneCelebration from '../animations/EndZoneCelebration';
import InteractiveBackground from '../common/InteractiveBackground';

interface LayoutProps {
  children: ReactNode;
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, setActivePage }) => {
  const { isFieldGoal, isLionsRoar, isHelmetCollision, isEndZone, clearAllCelebrations } = useCelebration();

  return (
    <div className="flex h-screen w-full flex-col font-sans overflow-hidden">
       <InteractiveBackground />
       <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 z-10" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}>
          <div className="flex items-center gap-2">
            <BrainCircuitIcon className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl font-semibold tracking-wider uppercase" style={{ color: 'hsl(var(--foreground))' }}>
              Synoptic Edge
            </h1>
          </div>
          {/* Top Tabs placeholder */}
          <div className="hidden md:block">
            <p className="text-sm" style={{ color: 'hsl(var(--muted-foreground))' }}>AI Edges / My Parlays / Game Matchups</p>
          </div>
          <ThemeToggle />
        </header>

      <main className="flex-1 overflow-y-auto relative z-0">
        {children}
      </main>

      {/* Global Animation Overlays */}
      {isFieldGoal && <FieldGoalCelebration onComplete={clearAllCelebrations} />}
      {isLionsRoar && <LionsRoar onComplete={clearAllCelebrations} />}
      {isHelmetCollision && <HelmetCollision onComplete={clearAllCelebrations} />}
      {isEndZone && <EndZoneCelebration onComplete={clearAllCelebrations} />}

      <FAB />
      <BottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
};

export default Layout;