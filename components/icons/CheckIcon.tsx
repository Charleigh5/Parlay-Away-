// CheckIcon.tsx
// Re-exports the lucide-react Check icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Check } from 'lucide-react';

export const CheckIcon: React.FC<React.ComponentProps<typeof Check>> = (props) => (
  <Check {...props} />
);
