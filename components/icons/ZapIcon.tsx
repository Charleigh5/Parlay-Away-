// ZapIcon.tsx
// Re-exports the lucide-react Zap icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Zap } from 'lucide-react';

export const ZapIcon: React.FC<React.ComponentProps<typeof Zap>> = (props) => (
  <Zap {...props} />
);
