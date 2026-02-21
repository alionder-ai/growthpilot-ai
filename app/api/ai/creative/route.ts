import { NextRequest, NextResponse } from 'next';
import { createClient } from '@/lib/supabase/server';
import { generateContent } from '@/lib/gemini/client';
import { buildCreativePrompt } from '@/lib/gemini/prompts';

/**
 * POST /api/ai/creative
 * Generate creative content using Gemini API
 * 
 * Requirements: 10.1, 10.2
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { industry, content_type, target_audience, objective, tone } = body;

    // Validate required fields
    if (!industry || !content_type) {
      return NextResponse.json(
        { error: 'Sektör ve içerik tipi zorunludur' },
        { status: 400 }
      );
    }

    // Validate industry (Requirement 10.1)
    const validIndustries = [
      'logistics',
      'e-commerce',
      'beauty',
      'real estate',
      'healthcare',
      'education',
    ];

    if (!validIndustries.includes(industry)) {
      return NextResponse.json(
        { error: 'Geçersiz sektör. Desteklenen sektörler: logistics, e-commerce, beauty, real estate, healthcare, education' },
        { status: 400 }
      );
    }

    // Validate content type (Requirement 10.3, 10.4, 10.5)
    const validContentTypes = ['ad_copy', 'video_script', 'voiceover'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: 'Geçersiz içerik tipi. Desteklenen tipler: ad_copy, video_script, voiceover' },
        { status: 400 }
      );
    }

    // Build prompt
    const prompt = buildCreativePrompt({
      industry,
      contentType: content_type,
      targetAudience: target_audience,
      objective,
      tone,
    });

    // Generate content with Gemini API
    const geminiResponse = await generateContent(prompt, 1000); // 1000 token limit per Requirement 18.6

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(geminiResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', geminiResponse);
      return NextResponse.json(
        { error: 'AI yanıtı işlenemedi' },
        { status: 500 }
      );
    }

    // Validate response structure
    if (!parsedResponse.variations || !Array.isArray(parsedResponse.variations)) {
      return NextResponse.json(
        { error: 'AI yanıtı beklenen formatta değil' },
        { status: 500 }
      );
    }

    // Return generated content
    return NextResponse.json({
      success: true,
      data: {
        industry,
        content_type,
        variations: parsedResponse.variations,
      },
    });
  } catch (error) {
    console.error('Creative generation error:', error);
    return NextResponse.json(
      { error: 'Kreatif içerik oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}
