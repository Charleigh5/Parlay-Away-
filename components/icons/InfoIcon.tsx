// InfoIcon.tsx
// Re-exports the lucide-react Info icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Info } from 'lucide-react';

export const InfoIcon: React.FC<React.ComponentProps<typeof Info>> = (props) => (
  <Info {...props} />
);
