// SparklesIcon.tsx
// Re-exports the lucide-react Sparkles icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Sparkles } from 'lucide-react';

export const SparklesIcon: React.FC<React.ComponentProps<typeof Sparkles>> = (props) => (
  <Sparkles {...props} />
);
