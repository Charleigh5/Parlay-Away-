// TargetIcon.tsx
// Re-exports the lucide-react Target icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Target } from 'lucide-react';

export const TargetIcon: React.FC<React.ComponentProps<typeof Target>> = (props) => (
  <Target {...props} />
);
