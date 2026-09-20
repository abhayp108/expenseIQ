import React from 'react';
import { Copy, Sparkles } from 'lucide-react';

interface DuplicateBadgeProps {
  isDuplicate?: boolean;
  reason?: string;
}

export const DuplicateBadge: React.FC<DuplicateBadgeProps> = ({ isDuplicate, reason }) => {
  if (isDuplicate) {
    return (
      <span className="badge badge-duplicate" title={reason || 'Possible duplicate transaction'}>
        <Copy className="w-3 h-3 mr-1 inline" />
        Duplicate
      </span>
    );
  }

  return (
    <span className="badge badge-new" title="New unique transaction">
      <Sparkles className="w-3 h-3 mr-1 inline" />
      New
    </span>
  );
};
