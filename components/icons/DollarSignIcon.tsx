// DollarSignIcon.tsx
// Re-exports the lucide-react DollarSign icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { DollarSign } from 'lucide-react';

export const DollarSignIcon: React.FC<React.ComponentProps<typeof DollarSign>> = (props) => (
  <DollarSign {...props} />
);
