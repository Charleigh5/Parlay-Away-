import React, { useState } from 'react';
// Fix: Alias motion import to avoid potential name collisions causing type errors.
import { motion as motionComponent, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './src/contexts/ThemeProvider';
import { TeamThemeProvider } from './src/contexts/TeamThemeProvider';
import { CelebrationProvider } from './src/contexts/CelebrationProvider';
import Layout from './src/components/layout/Layout';
import DashboardPage from './src/pages/DashboardPage';
import BuildParlayPage from './src/pages/BuildParlayPage';
import InsightsPage from './src/pages/InsightsPage';
import HistoryPage from './src/pages/HistoryPage';
import AccountPage from './src/pages/AccountPage';

export type Page = 'dashboard' | 'build' | 'insights' | 'history' | 'account';

const pageVariants = {
  initial: {
    opacity: 0,
    x: '-100vw',
    scale: 0.8,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: '100vw',
    scale: 1.2,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.5,
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'build': return <BuildParlayPage />;
      case 'insights': return <InsightsPage />;
      case 'history': return <HistoryPage />;
      case 'account': return <AccountPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <ThemeProvider>
      <TeamThemeProvider>
        <CelebrationProvider>
          <Layout activePage={activePage} setActivePage={setActivePage}>
            <AnimatePresence mode="wait">
              <motionComponent.div
                key={activePage}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                {renderPage()}
              </motionComponent.div>
            </AnimatePresence>
          </Layout>
        </CelebrationProvider>
      </TeamThemeProvider>
    </ThemeProvider>
  );
};

export default App;
