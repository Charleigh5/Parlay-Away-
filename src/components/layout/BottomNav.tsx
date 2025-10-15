import React from 'react';
import { Page } from '../../../App';
import { DashboardIcon } from '../../assets/icons/DashboardIcon';
import { InsightsIcon } from '../../assets/icons/InsightsIcon';
import { HistoryIcon } from '../../assets/icons/HistoryIcon';
import { AccountIcon } from '../../assets/icons/AccountIcon';
import { PlusCircleIcon } from '../../assets/icons/PlusCircleIcon';

interface BottomNavProps {
  activePage: Page;
  setActivePage: (page: Page) => void;
}

const navItems = [
  { page: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
  { page: 'insights', label: 'Insights', icon: InsightsIcon },
  { page: 'build', label: 'Build Parlay', icon: PlusCircleIcon, isCentral: true },
  { page: 'history', label: 'History', icon: HistoryIcon },
  { page: 'account', label: 'Account', icon: AccountIcon },
] as const;

const NavItem: React.FC<{
  item: typeof navItems[number];
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  const activeColor = 'hsl(var(--primary))';
  const inactiveColor = 'hsl(var(--muted-foreground))';

  // Fix: Add a type guard to safely check for the 'isCentral' property.
  if ('isCentral' in item && item.isCentral) {
    return (
       <button onClick={onClick} className="-mt-6 flex h-16 w-16 items-center justify-center rounded-full border-4 shadow-lg" style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))', borderColor: 'hsl(var(--background))' }} aria-label={item.label}>
          <Icon className="h-8 w-8" />
       </button>
    );
  }
  return (
    <button onClick={onClick} className="flex flex-1 flex-col items-center justify-center gap-1 py-2 group" aria-label={item.label} aria-current={isActive}>
      <Icon className="h-6 w-6 transition-colors" style={{ color: isActive ? activeColor : inactiveColor }} />
      <span className="text-xs transition-colors group-hover:text-[hsl(var(--foreground))]" style={{ color: isActive ? activeColor : inactiveColor }}>
          {item.label}
      </span>
    </button>
  );
};


const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage }) => {
  return (
    <nav className="flex h-16 items-center justify-around border-t" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}>
      {navItems.map((item) => (
        <NavItem
          key={item.page}
          item={item}
          isActive={activePage === item.page}
          onClick={() => setActivePage(item.page)}
        />
      ))}
    </nav>
  );
};

export default BottomNav;
