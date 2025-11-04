// SearchIcon.tsx
// Re-exports the lucide-react Search icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Search } from 'lucide-react';

export const SearchIcon: React.FC<React.ComponentProps<typeof Search>> = (props) => (
  <Search {...props} />
);
