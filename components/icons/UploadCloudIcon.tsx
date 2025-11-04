// UploadCloudIcon.tsx
// Re-exports the lucide-react UploadCloud icon for consistent usage across Project Synoptic Edge.
import React from 'react';
import { UploadCloud } from 'lucide-react';

export const UploadCloudIcon: React.FC<React.ComponentProps<typeof UploadCloud>> = (props) => (
  <UploadCloud {...props} />
);
