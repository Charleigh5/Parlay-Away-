// XCircleIcon.tsx
// Re-exports the lucide-react XCircle icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { XCircle } from 'lucide-react';

export const XCircleIcon: React.FC<React.ComponentProps<typeof XCircle>> = (props) => (
  <XCircle {...props} />
);
