import React from 'react';
import { PlusIcon } from '../../assets/icons/PlusIcon';

const FAB: React.FC = () => {
    const handleClick = () => {
        // In a future phase, this will open a modal for quick parlay entry.
        console.log('FAB clicked: Open Quick Add Parlay modal.');
        alert('Quick Add Parlay functionality will be implemented in a future phase.');
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-20 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-100"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
            aria-label="Quick Add Parlay"
        >
            <PlusIcon className="h-7 w-7" />
        </button>
    );
};

export default FAB;
