// TrendingDownIcon.tsx
// Re-exports the lucide-react TrendingDown icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { TrendingDown } from 'lucide-react';

export const TrendingDownIcon: React.FC<React.ComponentProps<typeof TrendingDown>> = (props) => (
  <TrendingDown {...props} />
);
