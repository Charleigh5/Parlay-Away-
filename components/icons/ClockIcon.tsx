// ClockIcon.tsx
// Re-exports the lucide-react Clock icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Clock } from 'lucide-react';

export const ClockIcon: React.FC<React.ComponentProps<typeof Clock>> = (props) => (
  <Clock {...props} />
);
