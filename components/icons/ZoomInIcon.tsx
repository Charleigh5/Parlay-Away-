// ZoomInIcon.tsx
// Re-exports the lucide-react ZoomIn icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ZoomIn } from 'lucide-react';

export const ZoomInIcon: React.FC<React.ComponentProps<typeof ZoomIn>> = (props) => (
  <ZoomIn {...props} />
);
