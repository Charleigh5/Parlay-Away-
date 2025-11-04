// Settings2Icon.tsx
// Re-exports the lucide-react Settings2 icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { Settings2 } from 'lucide-react';

export const Settings2Icon: React.FC<React.ComponentProps<typeof Settings2>> = (props) => (
  <Settings2 {...props} />
);
