// TrendingUpIcon.tsx
// Re-exports the lucide-react TrendingUp icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { TrendingUp } from 'lucide-react';

export const TrendingUpIcon: React.FC<React.ComponentProps<typeof TrendingUp>> = (props) => (
  <TrendingUp {...props} />
);
