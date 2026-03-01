'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';

interface TargetAudienceFormProps {
  onSubmit: (industry: string) => Promise<void>;
  isLoading: boolean;
  error?: string | null;
}

/**
 * TargetAudienceForm Component
 * 
 * Form for collecting industry input and triggering strategic analysis generation.
 * Includes validation, loading states, and error display.
 * 
 * @param onSubmit - Async function to handle form submission
 * @param isLoading - Loading state indicator
 * @param error - Optional error message to display
 */
export function TargetAudienceForm({ onSubmit, isLoading, error }: TargetAudienceFormProps) {
  const [industry, setIndustry] = React.useState('');
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation error
    setValidationError(null);
    
    // Validate input
    const trimmedIndustry = industry.trim();
    if (!trimmedIndustry) {
      setValidationError('Bu alan zorunludur');
      // Focus input on validation error
      inputRef.current?.focus();
      return;
    }
    
    // Call parent submit handler
    await onSubmit(trimmedIndustry);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIndustry(e.target.value);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
  };
  
  const displayError = validationError || error;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
      <fieldset disabled={isLoading} className="space-y-2">
        <legend className="sr-only">Hedef Kitle Analizi Formu</legend>
        <label
          htmlFor="industry-input"
          className="text-xs sm:text-sm font-medium text-foreground block"
        >
          Sektör/Endüstri
        </label>
        <Input
          ref={inputRef}
          id="industry-input"
          name="industry"
          type="text"
          value={industry}
          onChange={handleInputChange}
          placeholder="Örn: Güzellik Merkezi, Gayrimenkul, E-ticaret"
          disabled={isLoading}
          required
          aria-required="true"
          className={cn(
            'text-sm sm:text-base',
            displayError && 'border-red-500 focus-visible:ring-red-500'
          )}
          aria-invalid={!!displayError}
          aria-describedby={displayError ? 'industry-error' : 'industry-description'}
        />
        <p id="industry-description" className="sr-only">
          Analiz yapmak istediğiniz sektör veya endüstriyi girin
        </p>
        {displayError && (
          <p
            id="industry-error"
            className="text-xs sm:text-sm text-red-500"
            role="alert"
            aria-live="polite"
          >
            {displayError}
          </p>
        )}
      </fieldset>
      
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full sm:w-auto text-sm sm:text-base"
        aria-busy={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Analiz Ediliyor...</span>
          </>
        ) : (
          'Analiz Et'
        )}
      </Button>
    </form>
  );
}
