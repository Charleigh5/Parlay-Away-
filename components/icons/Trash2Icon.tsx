// Trash2Icon.tsx
// Re-exports the lucide-react Trash2 icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Trash2 } from 'lucide-react';

export const Trash2Icon: React.FC<React.ComponentProps<typeof Trash2>> = (props) => (
  <Trash2 {...props} />
);
