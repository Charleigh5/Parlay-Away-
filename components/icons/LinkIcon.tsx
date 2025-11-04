// LinkIcon.tsx
// Re-exports the lucide-react Link icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Link } from 'lucide-react';

export const LinkIcon: React.FC<React.ComponentProps<typeof Link>> = (props) => (
  <Link {...props} />
);
