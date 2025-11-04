import React, { useState, useMemo } from 'react';
import { useTeamTheme } from '../../hooks/useTeamTheme';
import { SearchIcon } from '@/components/icons/SearchIcon';
import { XIcon } from '@/components/icons/XIcon';
import { Team } from '../../data/nflTeams';

interface TeamSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeamSelector: React.FC<TeamSelectorProps> = ({ isOpen, onClose }) => {
  const { teams, selectedTeam, setTeam } = useTeamTheme();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTeams = useMemo(() => {
    if (!searchTerm) return teams;
    const lowerSearch = searchTerm.toLowerCase();
    return teams.filter(
      team =>
        team.name.toLowerCase().includes(lowerSearch) ||
        team.city.toLowerCase().includes(lowerSearch)
    );
  }, [teams, searchTerm]);

  const handleSelectTeam = (teamId: string) => {
    setTeam(teamId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-lg shadow-xl m-4 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-200">Select Your Team</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-600"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-900 border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-200 focus:ring-1"
              style={{ '--ring-color': 'hsl(var(--ring))' } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="p-6 h-96 overflow-y-auto">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {filteredTeams.map(team => {
              const isSelected = team.id === selectedTeam.id;
              return (
                <button
                  key={team.id}
                  onClick={() => handleSelectTeam(team.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg text-center transition-all duration-200 ring-offset-2 ring-offset-gray-800 ${isSelected ? 'ring-2' : 'hover:scale-105'}`}
                  style={{
                    backgroundColor: 'hsl(var(--secondary))',
                    borderColor: 'hsl(var(--primary))',
                  }}
                >
                  <div className="h-16 w-16 flex items-center justify-center">
                    <img src={`src/assets/logos/${team.id}.svg`} alt={`${team.name} logo`} className="h-full w-full object-contain" />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: 'hsl(var(--foreground))' }}>{team.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSelector;