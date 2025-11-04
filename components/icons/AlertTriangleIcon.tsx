// AlertTriangleIcon.tsx
// Re-exports the lucide-react AlertTriangle icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const AlertTriangleIcon: React.FC<React.ComponentProps<typeof AlertTriangle>> = (props) => (
  <AlertTriangle {...props} />
);
