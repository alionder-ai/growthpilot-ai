import { CreativeGenerator } from '@/components/creative/CreativeGenerator';

/**
 * Creative Generator Page
 * AI-powered creative content generation for multiple industries
 * 
 * Requirements: 10.1-10.7
 */
export default function CreativeGeneratorPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Kreatif İçerik Üretici</h1>
        <p className="text-muted-foreground mt-2">
          Yapay zeka ile sektörünüze özel reklam içerikleri oluşturun
        </p>
      </div>
      <CreativeGenerator />
    </div>
  );
}
