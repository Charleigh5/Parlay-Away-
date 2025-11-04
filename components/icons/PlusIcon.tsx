// PlusIcon.tsx
// Re-exports the lucide-react Plus icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Plus } from 'lucide-react';

export const PlusIcon: React.FC<React.ComponentProps<typeof Plus>> = (props) => (
  <Plus {...props} />
);
