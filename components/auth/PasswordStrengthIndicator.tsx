'use client';

import { getPasswordStrength, getPasswordStrengthMessage } from '@/lib/utils/validation';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = getPasswordStrength(password);
  const message = getPasswordStrengthMessage(password);

  const getColor = () => {
    switch (strength) {
      case 'weak':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'strong':
        return 'bg-green-500';
    }
  };

  const getWidth = () => {
    switch (strength) {
      case 'weak':
        return 'w-1/3';
      case 'medium':
        return 'w-2/3';
      case 'strong':
        return 'w-full';
    }
  };

  return (
    <div className="space-y-1">
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${getColor()} ${getWidth()}`}
        />
      </div>
      <p className={`text-xs ${
        strength === 'weak' ? 'text-red-600' :
        strength === 'medium' ? 'text-yellow-600' :
        'text-green-600'
      }`}>
        {message}
      </p>
    </div>
  );
}
