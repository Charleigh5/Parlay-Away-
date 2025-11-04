// TestTubeIcon.tsx
// Re-exports the lucide-react TestTube icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { TestTube } from 'lucide-react';

export const TestTubeIcon: React.FC<React.ComponentProps<typeof TestTube>> = (props) => (
  <TestTube {...props} />
);
