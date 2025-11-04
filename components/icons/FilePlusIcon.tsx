// FilePlusIcon.tsx
// Re-exports the lucide-react FilePlus icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { FilePlus } from 'lucide-react';

export const FilePlusIcon: React.FC<React.ComponentProps<typeof FilePlus>> = (props) => (
  <FilePlus {...props} />
);
