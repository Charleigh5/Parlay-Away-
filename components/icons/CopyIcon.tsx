// CopyIcon.tsx
// Re-exports the lucide-react Copy icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Copy } from 'lucide-react';

export const CopyIcon: React.FC<React.ComponentProps<typeof Copy>> = (props) => (
  <Copy {...props} />
);
