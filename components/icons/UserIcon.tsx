// UserIcon.tsx
// Re-exports the lucide-react User icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { User } from 'lucide-react';

export const UserIcon: React.FC<React.ComponentProps<typeof User>> = (props) => (
  <User {...props} />
);
