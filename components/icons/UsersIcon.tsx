// UsersIcon.tsx
// Re-exports the lucide-react Users icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Users } from 'lucide-react';

export const UsersIcon: React.FC<React.ComponentProps<typeof Users>> = (props) => (
  <Users {...props} />
);
