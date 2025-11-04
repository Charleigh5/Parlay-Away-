// ChevronLeftIcon.tsx
// Re-exports the lucide-react ChevronLeft icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const ChevronLeftIcon: React.FC<React.ComponentProps<typeof ChevronLeft>> = (props) => (
  <ChevronLeft {...props} />
);
