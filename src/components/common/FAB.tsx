import React from 'react';
import { PlusIcon } from '../../assets/icons/PlusIcon';
import { useQuickAddModal } from '../../contexts/QuickAddModalContext';

const FAB: React.FC = () => {
    const { openModal } = useQuickAddModal();

    const handleClick = () => {
        console.log('FAB clicked: Open Quick Add Parlay modal.');
        openModal();
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
