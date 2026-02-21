'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * CreativeGenerator Component
 * Generate creative content using AI based on industry and content type
 * 
 * Requirements: 10.2, 10.6, 10.7
 */

interface CreativeVariation {
  title: string;
  content: string;
  cta: string;
  scenes?: string[];
  tone_notes?: string;
  pacing_notes?: string;
}

export function CreativeGenerator() {
  const [industry, setIndustry] = useState<string>('');
  const [contentType, setContentType] = useState<string>('ad_copy');
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [objective, setObjective] = useState<string>('');
  const [tone, setTone] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [variations, setVariations] = useState<CreativeVariation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Industry options (Requirement 10.1)
  const industries = [
    { value: 'logistics', label: 'Lojistik' },
    { value: 'e-commerce', label: 'E-Ticaret' },
    { value: 'beauty', label: 'Güzellik & Kozmetik' },
    { value: 'real estate', label: 'Gayrimenkul' },
    { value: 'healthcare', label: 'Sağlık' },
    { value: 'education', label: 'Eğitim' },
  ];

  // Content type options (Requirement 10.3, 10.4, 10.5)
  const contentTypes = [
    { value: 'ad_copy', label: 'Reklam Metni', description: 'Sosyal medya ve dijital reklamlar için metin' },
    { value: 'video_script', label: 'Video Senaryosu', description: 'Sahne açıklamaları ile video senaryosu' },
    { value: 'voiceover', label: 'Seslendirme Metni', description: 'Ton ve tempo notları ile seslendirme' },
  ];

  const handleGenerate = async () => {
    if (!industry) {
      setError('Lütfen bir sektör seçin');
      return;
    }

    setIsGenerating(true);
    setVariations([]);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/ai/creative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry,
          content_type: contentType,
          target_audience: targetAudience || undefined,
          objective: objective || undefined,
          tone: tone || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'İçerik oluşturulamadı');
      }

      setVariations(result.data.variations);
      setSuccessMessage(`${result.data.variations.length} varyasyon oluşturuldu`);
    } catch (error) {
      console.error('Generate error:', error);
      setError(error instanceof Error ? error.message : 'İçerik oluşturulurken bir hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToLibrary = async (variationIndex: number) => {
    const variation = variations[variationIndex];
    if (!variation) return;

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Format content based on type
      let contentText = `${variation.title}\n\n${variation.content}\n\nCTA: ${variation.cta}`;
      
      if (variation.scenes) {
        contentText += '\n\nSahneler:\n' + variation.scenes.map((s, i) => `${i + 1}. ${s}`).join('\n');
      }
      
      if (variation.tone_notes) {
        contentText += `\n\nTon Notları: ${variation.tone_notes}`;
      }
      
      if (variation.pacing_notes) {
        contentText += `\n\nTempo Notları: ${variation.pacing_notes}`;
      }

      const response = await fetch('/api/creative-library', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry,
          content_type: contentType,
          content_text: contentText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kaydedilemedi');
      }

      setSuccessMessage('İçerik kütüphaneye kaydedildi');
    } catch (error) {
      console.error('Save error:', error);
      setError(error instanceof Error ? error.message : 'Kaydedilirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Kreatif İçerik Üretici</CardTitle>
          <CardDescription>
            Yapay zeka ile sektörünüze özel reklam içerikleri oluşturun
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Industry Selector */}
          <div className="space-y-2">
            <Label htmlFor="industry">Sektör *</Label>
            <Select value={industry} onValueChange={setIndustry}>
              <SelectTrigger id="industry">
                <SelectValue placeholder="Sektör seçin" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((ind) => (
                  <SelectItem key={ind.value} value={ind.value}>
                    {ind.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content Type Selector */}
          <div className="space-y-2">
            <Label>İçerik Tipi *</Label>
            <RadioGroup value={contentType} onValueChange={setContentType}>
              {contentTypes.map((type) => (
                <div key={type.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={type.value} id={type.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={type.value} className="font-medium cursor-pointer">
                      {type.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Optional Fields */}
          <div className="space-y-2">
            <Label htmlFor="target-audience">Hedef Kitle (Opsiyonel)</Label>
            <Input
              id="target-audience"
              placeholder="Örn: 25-45 yaş arası kadınlar"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Kampanya Amacı (Opsiyonel)</Label>
            <Input
              id="objective"
              placeholder="Örn: Marka bilinirliği, satış artışı"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Ton (Opsiyonel)</Label>
            <Input
              id="tone"
              placeholder="Örn: Samimi, profesyonel, eğlenceli"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !industry}
            className="w-full"
          >
            {isGenerating ? 'Oluşturuluyor...' : 'İçerik Oluştur'}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Variations */}
      {variations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Oluşturulan Varyasyonlar</h3>
          {variations.map((variation, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{variation.title}</CardTitle>
                    <CardDescription>Varyasyon {index + 1}</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSaveToLibrary(index)}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Kaydediliyor...' : 'Kütüphaneye Kaydet'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">İçerik</Label>
                  <p className="mt-1 text-sm whitespace-pre-wrap">{variation.content}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Harekete Geçirici Mesaj (CTA)</Label>
                  <p className="mt-1 text-sm font-semibold">{variation.cta}</p>
                </div>

                {variation.scenes && variation.scenes.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Sahneler</Label>
                    <ul className="mt-1 space-y-1">
                      {variation.scenes.map((scene, i) => (
                        <li key={i} className="text-sm">
                          {i + 1}. {scene}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {variation.tone_notes && (
                  <div>
                    <Label className="text-sm font-medium">Ton Notları</Label>
                    <p className="mt-1 text-sm">{variation.tone_notes}</p>
                  </div>
                )}

                {variation.pacing_notes && (
                  <div>
                    <Label className="text-sm font-medium">Tempo Notları</Label>
                    <p className="mt-1 text-sm">{variation.pacing_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
