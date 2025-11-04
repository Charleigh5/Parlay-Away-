// PackageSearchIcon.tsx
// Re-exports the lucide-react PackageSearch icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { PackageSearch } from 'lucide-react';

export const PackageSearchIcon: React.FC<React.ComponentProps<typeof PackageSearch>> = (props) => (
  <PackageSearch {...props} />
);
