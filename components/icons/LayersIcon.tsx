// LayersIcon.tsx
// Re-exports the lucide-react Layers icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Layers } from 'lucide-react';

export const LayersIcon: React.FC<React.ComponentProps<typeof Layers>> = (props) => (
  <Layers {...props} />
);
