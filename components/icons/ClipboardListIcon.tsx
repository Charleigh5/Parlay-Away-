// ClipboardListIcon.tsx
// Re-exports the lucide-react ClipboardList icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ClipboardList } from 'lucide-react';

export const ClipboardListIcon: React.FC<React.ComponentProps<typeof ClipboardList>> = (props) => (
  <ClipboardList {...props} />
);
