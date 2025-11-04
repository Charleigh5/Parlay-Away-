// ListChecksIcon.tsx
// Re-exports the lucide-react ListChecks icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ListChecks } from 'lucide-react';

export const ListChecksIcon: React.FC<React.ComponentProps<typeof ListChecks>> = (props) => (
  <ListChecks {...props} />
);
