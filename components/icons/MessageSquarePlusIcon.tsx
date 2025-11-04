// MessageSquarePlusIcon.tsx
// Re-exports the lucide-react MessageSquarePlus icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

export const MessageSquarePlusIcon: React.FC<React.ComponentProps<typeof MessageSquarePlus>> = (props) => (
  <MessageSquarePlus {...props} />
);
