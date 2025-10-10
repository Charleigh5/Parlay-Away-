import React, { useState, useMemo, useEffect, DragEvent } from 'react';
import { Game, ExtractedBetLeg } from '../types';
// FIX: Added getTeamRoster to the import to resolve 'Cannot find name' errors.
import { getScheduleByWeek, getTeamRoster } from '../services/nflDataService';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { formatAmericanOdds } from '../utils';

const DraggablePropItem: React.FC<{ leg: ExtractedBetLeg }> = ({ leg }) => {
    const handleDragStart = (e: DragEvent) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('application/type', 'prop-library-item');
        e.dataTransfer.setData('application/json', JSON.stringify(leg));
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            className="p-2 bg-gray-800/50 rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-700/70 transition-colors"
        >
            <p className="text-sm font-semibold text-gray-200">{leg.player}</p>
            <div className="flex justify-between items-center text-xs text-gray-400">
                <span>{`${leg.position} ${leg.line} ${leg.propType}`}</span>
                <span className="font-mono text-cyan-400">{formatAmericanOdds(leg.marketOdds)}</span>
            </div>
        </div>
    );
};

const PropLibrary: React.FC = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                // For the library, we need player data, so we'll fetch from the detailed service
                const schedule = await getScheduleByWeek(2024, 1);
                // In a real app, a dedicated endpoint would provide all props.
                // Here, we simulate by fetching rosters for each game.
                 const detailedGames = await Promise.all(schedule.games.map(async game => {
                    const homeRoster = game.homeTeam ? await getTeamRoster(game.homeTeam.id) : { players: [] };
                    const awayRoster = game.awayTeam ? await getTeamRoster(game.awayTeam.id) : { players: [] };
                    return { ...game, players: [...homeRoster.players, ...awayRoster.players] };
                }));

                setGames(detailedGames);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load prop library.");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const allLegs = useMemo(() => {
        const legs: ExtractedBetLeg[] = [];
        games.forEach(game => {
            game.players?.forEach(player => {
                player.props.forEach(prop => {
                    prop.lines.forEach(line => {
                        legs.push({ player: player.name, propType: prop.propType, line: line.line, position: 'Over', marketOdds: line.overOdds, gameId: game.id, team: player.team });
                        legs.push({ player: player.name, propType: prop.propType, line: line.line, position: 'Under', marketOdds: line.underOdds, gameId: game.id, team: player.team });
                    });
                });
            });
        });
        return legs;
    }, [games]);

    const filteredLegs = useMemo(() => {
        if (!searchTerm) return allLegs;
        const lowerSearch = searchTerm.toLowerCase();
        return allLegs.filter(leg =>
            leg.player.toLowerCase().includes(lowerSearch) ||
            leg.propType.toLowerCase().includes(lowerSearch)
        );
    }, [allLegs, searchTerm]);
    
    const legsByGame = useMemo(() => {
        const grouped: Record<string, ExtractedBetLeg[]> = {};
        filteredLegs.forEach(leg => {
            if (leg.gameId) {
                if (!grouped[leg.gameId]) grouped[leg.gameId] = [];
                grouped[leg.gameId].push(leg);
            }
        });
        return grouped;
    }, [filteredLegs]);

    const toggleGame = (gameId: string) => {
        setExpandedGames(prev => ({ ...prev, [gameId]: !prev[gameId] }));
    };

    return (
        <aside className="w-80 flex-shrink-0 bg-gray-900/50 border-r border-gray-700/50 flex flex-col">
            <header className="p-4 border-b border-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-200 mb-2">Prop Library</h3>
                 <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search props or players..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-600 rounded-md pl-9 pr-3 py-1.5 text-sm text-gray-200 focus:ring-1 focus:ring-cyan-500"
                    />
                </div>
            </header>
            <div className="flex-1 overflow-y-auto p-2">
                {isLoading && <div className="p-4 text-center text-sm text-gray-400">Loading markets...</div>}
                {error && <div className="p-4 text-center text-sm text-red-400">{error}</div>}
                {!isLoading && Object.keys(legsByGame).map(gameId => {
                    const game = games.find(g => g.id === gameId);
                    if (!game) return null;
                    const isExpanded = expandedGames[gameId] ?? false;
                    return (
                        <div key={gameId} className="mb-1">
                            <button onClick={() => toggleGame(gameId)} className="w-full flex justify-between items-center text-left p-2 bg-gray-800 rounded-md hover:bg-gray-700/70">
                                <span className="text-sm font-medium text-gray-300">{game.name}</span>
                                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="p-2 space-y-1 animate-fade-in">
                                    {legsByGame[gameId].map((leg, index) => (
                                        <DraggablePropItem key={index} leg={leg} />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default PropLibrary;
