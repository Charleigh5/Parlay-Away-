// ShieldCheckIcon.tsx
// Re-exports the lucide-react ShieldCheck icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const ShieldCheckIcon: React.FC<React.ComponentProps<typeof ShieldCheck>> = (props) => (
  <ShieldCheck {...props} />
);
