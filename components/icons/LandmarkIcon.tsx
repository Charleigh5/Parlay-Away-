// LandmarkIcon.tsx
// Re-exports the lucide-react Landmark icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Landmark } from 'lucide-react';

export const LandmarkIcon: React.FC<React.ComponentProps<typeof Landmark>> = (props) => (
  <Landmark {...props} />
);
