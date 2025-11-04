// BarChartIcon.tsx
// Re-exports the lucide-react BarChart icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { BarChart } from 'lucide-react';

export const BarChartIcon: React.FC<React.ComponentProps<typeof BarChart>> = (props) => (
  <BarChart {...props} />
);
