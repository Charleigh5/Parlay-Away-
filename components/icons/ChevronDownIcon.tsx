// ChevronDownIcon.tsx
// Re-exports the lucide-react ChevronDown icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ChevronDown } from 'lucide-react';

export const ChevronDownIcon: React.FC<React.ComponentProps<typeof ChevronDown>> = (props) => (
  <ChevronDown {...props} />
);
