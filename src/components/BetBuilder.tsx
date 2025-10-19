import React, { useState, useMemo, useCallback } from 'react';
import { RankedPlayerProp } from '../types';
import { getAllEligiblePlayers } from '../services/propDiscoveryService';
import { batchAnalyzeProps } from '../services/betAnalysisService';
import { exportToCsv, formatAmericanOdds } from '../utils';
import { SparklesIcon } from '../assets/icons/SparklesIcon';
import { PlusIcon } from '../assets/icons/PlusIcon';
import { Trash2Icon } from '../assets/icons/Trash2Icon';
import AnalysisPanel from './bet_builder/AnalysisPanel';

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);
const PROP_TYPES = [
    'Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Passing Touchdowns', 'Receptions'
];

const BetBuilder: React.FC = () => {
    // Filter State
    const [week, setWeek] = useState<number>(1);
    const [propType, setPropType] = useState<string>('Passing Yards');
    const [maxOdds, setMaxOdds] = useState<number>(-150);
    const [minEv, setMinEv] = useState<number>(1);

    // Data & UI State
    const [potentialLegs, setPotentialLegs] = useState<RankedPlayerProp[]>([]);
    const [parlayLegs, setParlayLegs] = useState<RankedPlayerProp[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFindLegs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setPotentialLegs([]);
        setProgress(0);
        
        try {
            const { eligiblePlayers, games } = await getAllEligiblePlayers(propType, week);
            
            const initialFilter = eligiblePlayers.filter(p => {
                 const marketProp = p.props.find(prop => prop.propType === propType);
                 if (!marketProp) return false;
                 // Check both over and under odds against the maxOdds threshold
                 return marketProp.lines.some(l => l.overOdds <= maxOdds || l.underOdds <= maxOdds);
            });

            if (initialFilter