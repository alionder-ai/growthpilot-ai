'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/cn';

interface ActionItem {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: string;
}

interface ActionPlanCardProps {
  recommendationId: string;
  actions: ActionItem[];
  onActionComplete?: (recommendationId: string) => void;
}

const priorityConfig = {
  high: {
    label: 'Yüksek',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  medium: {
    label: 'Orta',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  low: {
    label: 'Düşük',
    className: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export function ActionPlanCard({
  recommendationId,
  actions,
  onActionComplete,
}: ActionPlanCardProps) {
  const [completedActions, setCompletedActions] = useState<Set<number>>(new Set());

  const handleActionToggle = async (index: number) => {
    const newCompleted = new Set(completedActions);
    
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    
    setCompletedActions(newCompleted);

    // If all actions are completed, mark the entire recommendation as complete
    if (newCompleted.size === actions.length && onActionComplete) {
      try {
        const response = await fetch(`/api/ai/recommendations/${recommendationId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'completed' }),
        });

        if (response.ok) {
          onActionComplete(recommendationId);
        }
      } catch (error) {
        console.error('Error updating action plan status:', error);
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Günlük Aksiyon Planı
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Bugün yapılması gereken en önemli 3 aksiyon
        </p>
      </div>

      <div className="space-y-4">
        {actions.map((action, index) => (
          <div
            key={index}
            className={cn(
              'flex items-start gap-3 p-4 rounded-lg border transition-opacity',
              completedActions.has(index) && 'opacity-50'
            )}
          >
            <Checkbox
              id={`action-${index}`}
              checked={completedActions.has(index)}
              onCheckedChange={() => handleActionToggle(index)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                    priorityConfig[action.priority].className
                  )}
                >
                  {priorityConfig[action.priority].label}
                </span>
              </div>
              
              <label
                htmlFor={`action-${index}`}
                className={cn(
                  'block text-sm font-medium text-gray-900 cursor-pointer',
                  completedActions.has(index) && 'line-through'
                )}
              >
                {action.action}
              </label>
              
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Beklenen Etki:</span> {action.expected_impact}
              </p>
            </div>
          </div>
        ))}
      </div>

      {completedActions.size === actions.length && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 font-medium">
            ✓ Tüm aksiyonlar tamamlandı!
          </p>
        </div>
      )}
    </Card>
  );
}

export default ActionPlanCard;
