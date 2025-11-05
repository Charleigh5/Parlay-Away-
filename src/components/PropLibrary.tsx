import React, { useState, useMemo, useEffect, DragEvent } from 'react';
import { Game, ExtractedBetLeg, Player } from '../types';
import { getScheduleByWeek, getTeamRoster } from '../services/nflDataService';
import { getOddsForGame } from '../services/draftkingsOddsService';
import { ChevronDownIcon, FilePlusIcon, SearchIcon } from './icons';
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

interface PropLibraryProps {
  onAddCustomProp: () => void;
}

const PropLibrary: React.FC<PropLibraryProps> = ({ onAddCustomProp }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGames, setExpandedGames] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const loadData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const scheduleResponse = await getScheduleByWeek(2024, 1);
                
                const detailedGamePromises = scheduleResponse.games.map(async (game) => {
                    const homeRosterPromise = game.homeTeam ? getTeamRoster(game.homeTeam.id) : Promise.resolve(null);
                    const awayRosterPromise = game.awayTeam ? getTeamRoster(game.awayTeam.id) : Promise.resolve(null);
                    const oddsPromise = getOddsForGame(game.id);

                    const [homeRoster, awayRoster, gameWithOdds] = await Promise.all([homeRosterPromise, awayRosterPromise, oddsPromise]);

                    const livePlayers = [...(homeRoster?.players ?? []), ...(awayRoster?.players ?? [])];
                    const livePlayerMap = new Map(livePlayers.map(p => [p.name, p]));

                    if (!gameWithOdds) {
                        return { ...game, players: livePlayers };
                    }
                    
                    const oddsPlayerMap = new Map<string, Player>(gameWithOdds.players.map(p => [p.name, p]));

                    const mergedPlayers: Player[] = Array.from(livePlayerMap.values()).map(livePlayer => {
                        const playerWithOdds = oddsPlayerMap.get(livePlayer.name);
                        if (playerWithOdds) {
                            return {
                                ...livePlayer,
                                props: playerWithOdds.props,
                            };
                        }
                        return livePlayer;
                    });
                    
                    return { ...game, players: mergedPlayers };
                });

                const gamesWithFullData = await Promise.all(detailedGamePromises);
                setGames(gamesWithFullData);

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
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-gray-200">Prop Library</h3>
                    <button
                        onClick={onAddCustomProp}
                        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md bg-gray-700 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                        title="Create a custom prop"
                    >
                        <FilePlusIcon className="h-4 w-4" />
                        Create
                    </button>
                </div>
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
