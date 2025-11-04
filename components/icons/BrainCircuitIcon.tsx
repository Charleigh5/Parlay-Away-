// BrainCircuitIcon.tsx
// Re-exports the lucide-react BrainCircuit icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { BrainCircuit } from 'lucide-react';

export const BrainCircuitIcon: React.FC<React.ComponentProps<typeof BrainCircuit>> = (props) => (
  <BrainCircuit {...props} />
);
