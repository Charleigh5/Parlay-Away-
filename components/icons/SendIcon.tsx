// SendIcon.tsx
// Re-exports the lucide-react Send icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Send } from 'lucide-react';

export const SendIcon: React.FC<React.ComponentProps<typeof Send>> = (props) => (
  <Send {...props} />
);
