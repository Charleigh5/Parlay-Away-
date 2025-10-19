import React, { useState } from 'react';
import { motion as motionComponent, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './contexts/ThemeProvider';
import { TeamThemeProvider } from './contexts/TeamThemeProvider';
import { CelebrationProvider } from './contexts/CelebrationProvider';
import { QuickAddModalProvider } from './contexts/QuickAddModalContext';
import Layout from './components/layout/Layout';
import DashboardPage from './pages/DashboardPage';
import MainPanel from './components/MainPanel'; // Changed from BuildParlayPage
import InsightsPage from './pages/InsightsPage';
import HistoryPage from './pages/HistoryPage';
import AccountPage from './pages/AccountPage';

export type Page = 'dashboard' | 'build' | 'insights' | 'history' | 'account';

const pageVariants = {
  initial: {
    opacity: 0,
    x: '-20vw',
    scale: 0.95,
  },
  in: {
    opacity: 1,
    x: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    x: '20vw',
    scale: 1.05,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'build': return <MainPanel />; // The functional builder is in MainPanel
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
          <QuickAddModalProvider>
            <Layout activePage={activePage} setActivePage={setActivePage}>
              <AnimatePresence mode="wait">
                <motionComponent.div
                  key={activePage}
                  initial="initial"
                  animate="in"
                  exit="out"
                  variants={pageVariants}
                  transition={pageTransition}
                  className="h-full"
                >
                  {renderPage()}
                </motionComponent.div>
              </AnimatePresence>
            </Layout>
          </QuickAddModalProvider>
        </CelebrationProvider>
      </TeamThemeProvider>
    </ThemeProvider>
  );
};

export default App;