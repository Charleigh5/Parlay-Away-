// ScaleIcon.tsx
// Re-exports the lucide-react Scale icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Scale } from 'lucide-react';

export const ScaleIcon: React.FC<React.ComponentProps<typeof Scale>> = (props) => (
  <Scale {...props} />
);
