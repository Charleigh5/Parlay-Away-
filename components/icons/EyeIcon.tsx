// EyeIcon.tsx
// Re-exports the lucide-react Eye icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Eye } from 'lucide-react';

export const EyeIcon: React.FC<React.ComponentProps<typeof Eye>> = (props) => (
  <Eye {...props} />
);
