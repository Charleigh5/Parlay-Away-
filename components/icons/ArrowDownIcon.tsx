// ArrowDownIcon.tsx
// Re-exports the lucide-react ArrowDown icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ArrowDown } from 'lucide-react';

export const ArrowDownIcon: React.FC<React.ComponentProps<typeof ArrowDown>> = (props) => (
  <ArrowDown {...props} />
);
