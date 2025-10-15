import { useContext } from 'react';
import TeamThemeContext from '../contexts/TeamThemeProvider';

export const useTeamTheme = () => {
  const context = useContext(TeamThemeContext);
  if (context === undefined) {
    throw new Error('useTeamTheme must be used within a TeamThemeProvider');
  }
  return context;
};