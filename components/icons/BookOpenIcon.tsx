// BookOpenIcon.tsx
// Re-exports the lucide-react BookOpen icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { BookOpen } from 'lucide-react';

export const BookOpenIcon: React.FC<React.ComponentProps<typeof BookOpen>> = (props) => (
  <BookOpen {...props} />
);
