'use client';

/**
 * Decision Badge Component
 * 
 * Displays Scale/Hold/Kill decision with Turkish labels and color coding.
 */

interface DecisionBadgeProps {
  decision: 'scale' | 'hold' | 'kill';
  size?: 'sm' | 'md' | 'lg';
}

export function DecisionBadge({ decision, size = 'md' }: DecisionBadgeProps) {
  const getLabel = () => {
    switch (decision) {
      case 'scale':
        return 'Ölçeklendir';
      case 'hold':
        return 'Beklet';
      case 'kill':
        return 'Durdur';
    }
  };

  const getColorClasses = () => {
    switch (decision) {
      case 'scale':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'kill':
        return 'bg-red-100 text-red-800 border-red-300';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'md':
        return 'text-sm px-3 py-1.5';
      case 'lg':
        return 'text-base px-4 py-2';
    }
  };

  const getIcon = () => {
    switch (decision) {
      case 'scale':
        return '📈';
      case 'hold':
        return '⏸️';
      case 'kill':
        return '🛑';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${getColorClasses()} ${getSizeClasses()}`}
    >
      <span>{getIcon()}</span>
      <span>{getLabel()}</span>
    </span>
  );
}
