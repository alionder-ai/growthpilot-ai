import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerSegmentCard } from './CustomerSegmentCard';
import { StrategicAnalysis } from '@/lib/types/target-audience';

interface AnalysisDisplayProps {
  analysis: StrategicAnalysis;
}

/**
 * AnalysisDisplay Component
 * 
 * Displays the complete strategic analysis including three customer segments
 * and irresistible offers. Implements responsive layout for desktop, tablet, and mobile.
 * 
 * @param analysis - Complete strategic analysis data from Gemini API
 */
export function AnalysisDisplay({ analysis }: AnalysisDisplayProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Customer Segments Section */}
      {/* Desktop: Two-column layout, Tablet/Mobile: Single-column stacked */}
      <section aria-labelledby="customer-segments-heading">
        <h2 id="customer-segments-heading" className="sr-only">Müşteri Segmentleri</h2>
        <div className="grid gap-4 sm:gap-6 md:grid-cols-1 lg:grid-cols-2">
          {/* Perfect Customer - Mükemmel Müşteri */}
          <CustomerSegmentCard
            segment={analysis.mukemmelMusteri}
            type="perfect"
            title="Mükemmel Müşteri"
          />
          
          {/* Necessary Customer - Mecburi Müşteri */}
          <CustomerSegmentCard
            segment={analysis.mecburiMusteri}
            type="necessary"
            title="Mecburi Müşteri"
          />
        </div>
      </section>
      
      {/* Unnecessary Customer - Gereksiz Müşteri (Full Width) */}
      <section aria-labelledby="unnecessary-customer-heading">
        <h2 id="unnecessary-customer-heading" className="sr-only">Gereksiz Müşteri</h2>
        <CustomerSegmentCard
          segment={analysis.gereksizMusteri}
          type="unnecessary"
          title="Gereksiz Müşteri"
        />
      </section>
      
      {/* Irresistible Offers Section */}
      <section aria-labelledby="offers-heading">
        <Card className="border-2 border-primary shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle id="offers-heading" className="text-lg sm:text-xl text-primary">
              Reddedilemez Teklifler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            {/* Perfect Customer Offer */}
            <OfferCard
              title="Mükemmel Müşteri Teklifi"
              offer={analysis.reddedilemezTeklifler.mukemmelMusteriTeklif}
              colorClass="border-green-500 bg-green-50/50"
            />
            
            {/* Necessary Customer Offer */}
            <OfferCard
              title="Mecburi Müşteri Teklifi"
              offer={analysis.reddedilemezTeklifler.mecburiMusteriTeklif}
              colorClass="border-yellow-500 bg-yellow-50/50"
            />
            
            {/* Unnecessary Customer Offer */}
            <OfferCard
              title="Gereksiz Müşteri Teklifi"
              offer={analysis.reddedilemezTeklifler.gereksizMusteriTeklif}
              colorClass="border-red-500 bg-red-50/50"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface OfferCardProps {
  title: string;
  offer: string;
  colorClass: string;
}

/**
 * OfferCard Component
 * 
 * Displays a single offer with color-coded styling.
 * Responsive padding and text sizing for mobile devices.
 */
function OfferCard({ title, offer, colorClass }: OfferCardProps) {
  return (
    <article className={`rounded-lg border-2 p-3 sm:p-4 ${colorClass}`}>
      <h3 className="mb-2 text-sm sm:text-base font-semibold text-foreground">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{offer}</p>
    </article>
  );
}
