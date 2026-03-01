'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportanceScoreBar } from './ImportanceScoreBar';
import { CustomerSegment, UnnecessaryCustomer } from '@/lib/types/target-audience';
import { cn } from '@/lib/utils/cn';

interface CustomerSegmentCardProps {
  segment: CustomerSegment | UnnecessaryCustomer;
  type: 'perfect' | 'necessary' | 'unnecessary';
  title: string;
}

/**
 * CustomerSegmentCard Component
 * 
 * Displays a customer segment with color-coded styling and collapsible sections.
 * Shows profile, desires, barriers, and needs with importance scores.
 * Responsive: Collapsible sections default to closed on mobile, open on desktop.
 * 
 * @param segment - Customer segment data (full segment or unnecessary customer)
 * @param type - Segment type for color coding (perfect=green, necessary=yellow, unnecessary=red)
 * @param title - Display title for the card
 */
export function CustomerSegmentCard({ segment, type, title }: CustomerSegmentCardProps) {
  // Determine if this is a full segment or just unnecessary customer
  const isFullSegment = 'icselArzular' in segment;
  
  // Color coding based on segment type
  const borderColorClass = {
    perfect: 'border-green-500',
    necessary: 'border-yellow-500',
    unnecessary: 'border-red-500',
  }[type];
  
  const titleColorClass = {
    perfect: 'text-green-600',
    necessary: 'text-yellow-600',
    unnecessary: 'text-red-600',
  }[type];
  
  // Generate unique ID for this card
  const cardId = `customer-segment-${type}`;
  
  return (
    <article 
      id={cardId}
      className={cn('border-2 shadow-sm', borderColorClass)}
      aria-labelledby={`${cardId}-title`}
    >
      <Card className="border-0">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle id={`${cardId}-title`} className={cn('text-lg sm:text-xl', titleColorClass)}>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Profile Section */}
          <section aria-labelledby={`${cardId}-profile-heading`}>
            <h3 id={`${cardId}-profile-heading`} className="mb-2 text-sm sm:text-base font-semibold text-foreground">
              Profil
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {segment.profil}
            </p>
          </section>
          
          {/* Full segment sections (only for perfect and necessary customers) */}
          {isFullSegment && (
            <>
              <CollapsibleSection 
                title="İçsel Arzular" 
                items={(segment as CustomerSegment).icselArzular}
                parentId={cardId}
              />
              <CollapsibleSection 
                title="Dışsal Arzular" 
                items={(segment as CustomerSegment).dissalArzular}
                parentId={cardId}
              />
              <CollapsibleSection 
                title="İçsel Engeller" 
                items={(segment as CustomerSegment).icselEngeller}
                parentId={cardId}
              />
              <CollapsibleSection 
                title="Dışsal Engeller" 
                items={(segment as CustomerSegment).dissalEngeller}
                parentId={cardId}
              />
              <CollapsibleSection 
                title="İhtiyaçlar" 
                items={(segment as CustomerSegment).ihtiyaclar}
                parentId={cardId}
              />
            </>
          )}
        </CardContent>
      </Card>
    </article>
  );
}

interface CollapsibleSectionProps {
  title: string;
  items: Array<{ text: string; score: number }>;
  parentId: string;
}

/**
 * CollapsibleSection Component
 * 
 * Displays a collapsible section with scored items.
 * Each item shows text and an importance score bar.
 * Responsive: Defaults to closed on mobile (< 768px), open on desktop.
 * Keyboard accessible with Enter/Space to toggle.
 */
function CollapsibleSection({ title, items, parentId }: CollapsibleSectionProps) {
  // Default to closed on mobile, open on desktop
  const [isOpen, setIsOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Generate unique IDs
  const sectionId = `${parentId}-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const buttonId = `${sectionId}-button`;
  const contentId = `${sectionId}-content`;
  
  React.useEffect(() => {
    setIsMounted(true);
    // Check if desktop on mount
    const isDesktop = window.innerWidth >= 768;
    setIsOpen(isDesktop);
  }, []);
  
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };
  
  // Prevent hydration mismatch by not rendering content until mounted
  if (!isMounted) {
    return (
      <section className="border-t pt-3 sm:pt-4" aria-labelledby={buttonId}>
        <button
          id={buttonId}
          className="flex w-full items-center justify-between text-left transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1 py-1"
          aria-expanded={false}
          aria-controls={contentId}
        >
          <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" aria-hidden="true" />
        </button>
      </section>
    );
  }
  
  return (
    <section className="border-t pt-3 sm:pt-4" aria-labelledby={buttonId}>
      <button
        id={buttonId}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="flex w-full items-center justify-between text-left transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-1 py-1"
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <h3 className="text-sm sm:text-base font-semibold text-foreground">{title}</h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
      
      {isOpen && (
        <div
          id={contentId}
          className="mt-2 sm:mt-3 space-y-2 sm:space-y-3 animate-in slide-in-from-top-2 duration-200"
          role="region"
          aria-labelledby={buttonId}
        >
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs sm:text-sm text-foreground">{item.text}</p>
              <ImportanceScoreBar score={item.score} label="Önem Skoru" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
