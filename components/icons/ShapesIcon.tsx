// ShapesIcon.tsx
// Re-exports the lucide-react Shapes icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Shapes } from 'lucide-react';

export const ShapesIcon: React.FC<React.ComponentProps<typeof Shapes>> = (props) => (
  <Shapes {...props} />
);
