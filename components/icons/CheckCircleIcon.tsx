// CheckCircleIcon.tsx
// Re-exports the lucide-react CheckCircle icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { CheckCircle } from 'lucide-react';

export const CheckCircleIcon: React.FC<React.ComponentProps<typeof CheckCircle>> = (props) => (
  <CheckCircle {...props} />
);
