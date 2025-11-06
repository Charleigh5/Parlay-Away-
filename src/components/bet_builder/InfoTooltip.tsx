import React from 'react';
import { InfoIcon } from '../icons';

interface InfoTooltipProps {
  info: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ info }) => {
  return (
    <div className="group relative flex items-center">
      <InfoIcon className="h-3.5 w-3.5 text-gray-500 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 w-48 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
        {info}
      </div>
    </div>
  );
};

export default InfoTooltip;
