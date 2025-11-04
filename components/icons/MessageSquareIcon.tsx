// MessageSquareIcon.tsx
// Re-exports the lucide-react MessageSquare icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { MessageSquare } from 'lucide-react';

export const MessageSquareIcon: React.FC<React.ComponentProps<typeof MessageSquare>> = (props) => (
  <MessageSquare {...props} />
);
