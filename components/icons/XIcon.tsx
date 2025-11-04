// XIcon.tsx
// Re-exports the lucide-react X icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { X } from 'lucide-react';

export const XIcon: React.FC<React.ComponentProps<typeof X>> = (props) => (
  <X {...props} />
);
