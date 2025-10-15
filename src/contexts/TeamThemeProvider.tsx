import React, { createContext, useState, useEffect, ReactNode } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { NFL_TEAMS, Team } from '../data/nflTeams';
import { TEAM_PALETTES, TeamPalette } from '../data/teamPalettes';

interface TeamThemeContextType {
  teams: Team[];
  selectedTeam: Team;
  setTeam: (teamId: string) => void;
}

const TeamThemeContext = createContext<TeamThemeContextType | undefined>(undefined);

export const TeamThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedTeamId, setSelectedTeamId] = useLocalStorage<string>('synoptic-edge-team', 'det');

  const selectedTeam = NFL_TEAMS.find(t => t.id === selectedTeamId) || NFL_TEAMS[0];

  useEffect(() => {
    const root = document.documentElement;
    const palette: TeamPalette = TEAM_PALETTES[selectedTeam.paletteId] || TEAM_PALETTES.default;
    
    // Set base variables for theme-agnostic use
    Object.entries(palette.base).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
    });

    // Set light mode variables
    Object.entries(palette.light).forEach(([key, value]) => {
      root.style.setProperty(`--${key}-light`, value);
    });
    
    // Set dark mode variables
    Object.entries(palette.dark).forEach(([key, value]) => {
      root.style.setProperty(`--${key}-dark`, value);
    });

    // Set dynamic hero images
    root.style.setProperty('--hero-image-dark', `url('${palette.base.heroImageDark}')`);
    root.style.setProperty('--hero-image-light', `url('${palette.base.heroImageLight}')`);


  }, [selectedTeam]);

  const setTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
  };

  const value = {
    teams: NFL_TEAMS,
    selectedTeam,
    setTeam,
  };

  return (
    <TeamThemeContext.Provider value={value}>
      {children}
    </TeamThemeContext.Provider>
  );
};

export default TeamThemeContext;
