// ZoomOutIcon.tsx
// Re-exports the lucide-react ZoomOut icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ZoomOut } from 'lucide-react';

export const ZoomOutIcon: React.FC<React.ComponentProps<typeof ZoomOut>> = (props) => (
  <ZoomOut {...props} />
);
