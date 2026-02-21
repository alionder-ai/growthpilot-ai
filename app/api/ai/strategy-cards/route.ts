import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';
import { buildStrategyCardPrompt } from '@/lib/gemini/prompts';

export const dynamic = 'force-dynamic';

interface StrategyCardResponse {
  do_actions: string[];
  dont_actions: string[];
  reasoning: string;
}

/**
 * POST /api/ai/strategy-cards
 * 
 * Generates AI-powered strategy cards based on metric thresholds
 * 
 * Request body:
 * - campaignId: UUID of the campaign
 * 
 * Returns:
 * - Strategy card with do_actions and dont_actions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { campaignId } = body;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Kampanya ID gerekli' },
        { status: 400 }
      );
    }

    // Verify campaign belongs to user's client
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        campaign_id,
        campaign_name,
        client_id,
        clients!inner (
          user_id,
          name
        )
      `)
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Kampanya bulunamadı' },
        { status: 404 }
      );
    }

    // Check if campaign belongs to user
    if ((campaign.clients as any).user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bu kampanyaya erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Get ad sets for this campaign
    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('ad_set_id')
      .eq('campaign_id', campaignId);

    const adSetIds = adSets?.map((as: any) => as.ad_set_id) || [];

    if (adSetIds.length === 0) {
      return NextResponse.json(
        { error: 'Bu kampanya için reklam seti bulunamadı' },
        { status: 404 }
      );
    }

    // Get ads for these ad sets
    const { data: ads } = await supabase
      .from('ads')
      .select('ad_id')
      .in('ad_set_id', adSetIds);

    const adIds = ads?.map((a: any) => a.ad_id) || [];

    if (adIds.length === 0) {
      return NextResponse.json(
        { error: 'Bu kampanya için reklam bulunamadı' },
        { status: 404 }
      );
    }

    // Get recent metrics (last 7 days for CPC comparison, last 1 day for current values)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const { data: recentMetrics, error: metricsError } = await supabase
      .from('meta_metrics')
      .select('frequency, roas, add_to_cart, purchases, cpc, date')
      .in('ad_id', adIds)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Metrikler alınırken hata oluştu' },
        { status: 500 }
      );
    }

    if (!recentMetrics || recentMetrics.length === 0) {
      return NextResponse.json(
        { error: 'Bu kampanya için metrik verisi bulunamadı' },
        { status: 404 }
      );
    }

    // Calculate average metrics for current period (last day)
    const currentMetrics = recentMetrics.filter((m: any) => 
      new Date(m.date) >= oneDayAgo
    );
    
    const avgFrequency = currentMetrics.reduce((sum: number, m: any) => 
      sum + (m.frequency || 0), 0) / (currentMetrics.length || 1);
    
    const avgRoas = currentMetrics.reduce((sum: number, m: any) => 
      sum + (m.roas || 0), 0) / (currentMetrics.length || 1);
    
    const totalAddToCart = currentMetrics.reduce((sum: number, m: any) => 
      sum + (m.add_to_cart || 0), 0);
    
    const totalPurchases = currentMetrics.reduce((sum: number, m: any) => 
      sum + (m.purchases || 0), 0);
    
    const currentCpc = currentMetrics.reduce((sum: number, m: any) => 
      sum + (m.cpc || 0), 0) / (currentMetrics.length || 1);

    // Calculate CPC from 7 days ago for comparison
    const oldMetrics = recentMetrics.filter((m: any) => 
      new Date(m.date) < oneDayAgo
    );
    
    const oldCpc = oldMetrics.length > 0 
      ? oldMetrics.reduce((sum: number, m: any) => sum + (m.cpc || 0), 0) / oldMetrics.length
      : currentCpc;

    const cpcIncreasePercent = oldCpc > 0 
      ? ((currentCpc - oldCpc) / oldCpc) * 100 
      : 0;

    // Get lead quality data for this campaign
    const { data: leads } = await supabase
      .from('leads')
      .select('lead_id, converted_status')
      .in('ad_id', adIds);

    let leadQuality = undefined;
    if (leads && leads.length > 0) {
      const totalLeads = leads.length;
      const convertedLeads = leads.filter((l: any) => l.converted_status).length;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      
      leadQuality = {
        totalLeads,
        convertedLeads,
        conversionRate
      };
    }

    // Check metric thresholds and generate strategy cards
    const strategyCards: any[] = [];

    // Requirement 8.1: Frequency > 4
    if (avgFrequency > 4) {
      const prompt = buildStrategyCardPrompt({
        situation: 'Reklam frekansı yüksek, kullanıcılar aynı reklamı çok fazla görüyor',
        metricName: 'Frekans',
        metricValue: avgFrequency,
        threshold: 4,
        leadQuality,
      });

      try {
        const geminiClient = getGeminiClient();
        const response = await geminiClient.generateJSON<StrategyCardResponse>(
          prompt,
          TOKEN_LIMITS.STRATEGY_CARD
        );

        strategyCards.push({
          trigger: 'high_frequency',
          metric_value: avgFrequency,
          ...response,
        });
      } catch (error) {
        console.error('Error generating frequency strategy card:', error);
      }
    }

    // Requirement 8.2: Add to cart high but purchases low
    if (totalAddToCart > 0 && totalPurchases > 0) {
      const conversionRate = (totalPurchases / totalAddToCart) * 100;
      
      if (conversionRate < 30) { // Less than 30% conversion from cart to purchase
        const prompt = buildStrategyCardPrompt({
          situation: 'Sepete ekleme sayısı yüksek ancak satın alma oranı düşük',
          metricName: 'Sepet-Satın Alma Dönüşüm Oranı',
          metricValue: conversionRate,
          threshold: 30,
          leadQuality,
        });

        try {
          const geminiClient = getGeminiClient();
          const response = await geminiClient.generateJSON<StrategyCardResponse>(
            prompt,
            TOKEN_LIMITS.STRATEGY_CARD
          );

          strategyCards.push({
            trigger: 'low_cart_conversion',
            metric_value: conversionRate,
            ...response,
          });
        } catch (error) {
          console.error('Error generating cart conversion strategy card:', error);
        }
      }
    }

    // Requirement 8.3: ROAS < 2
    if (avgRoas < 2) {
      const prompt = buildStrategyCardPrompt({
        situation: 'ROAS hedefin altında, kampanya karlılığı düşük',
        metricName: 'ROAS',
        metricValue: avgRoas,
        threshold: 2,
        leadQuality,
      });

      try {
        const geminiClient = getGeminiClient();
        const response = await geminiClient.generateJSON<StrategyCardResponse>(
          prompt,
          TOKEN_LIMITS.STRATEGY_CARD
        );

        strategyCards.push({
          trigger: 'low_roas',
          metric_value: avgRoas,
          ...response,
        });
      } catch (error) {
        console.error('Error generating ROAS strategy card:', error);
      }
    }

    // Requirement 8.4: CPC increase > 20% in 7 days
    if (cpcIncreasePercent > 20) {
      const prompt = buildStrategyCardPrompt({
        situation: 'Son 7 günde TBM (CPC) %20\'den fazla arttı',
        metricName: 'TBM Artış Oranı',
        metricValue: cpcIncreasePercent,
        threshold: 20,
        leadQuality,
      });

      try {
        const geminiClient = getGeminiClient();
        const response = await geminiClient.generateJSON<StrategyCardResponse>(
          prompt,
          TOKEN_LIMITS.STRATEGY_CARD
        );

        strategyCards.push({
          trigger: 'cpc_increase',
          metric_value: cpcIncreasePercent,
          ...response,
        });
      } catch (error) {
        console.error('Error generating CPC increase strategy card:', error);
      }
    }

    if (strategyCards.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Şu anda strateji kartı oluşturulacak bir durum yok',
        strategy_cards: [],
      });
    }

    // Store strategy cards in database (Requirement 8.7)
    const insertPromises = strategyCards.map(async (card) => {
      const { data, error } = await supabase
        .from('ai_recommendations')
        .insert({
          client_id: campaign.client_id,
          campaign_id: campaignId,
          recommendation_type: 'strategy_card',
          content: {
            trigger: card.trigger,
            metric_value: card.metric_value,
            do_actions: card.do_actions,
            dont_actions: card.dont_actions,
            reasoning: card.reasoning,
          },
          priority: 'high',
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing strategy card:', error);
        return null;
      }

      return data;
    });

    const storedCards = await Promise.all(insertPromises);
    const successfulCards = storedCards.filter(card => card !== null);

    return NextResponse.json({
      success: true,
      strategy_cards: successfulCards,
      count: successfulCards.length,
    });
  } catch (error) {
    console.error('Error in strategy card generation:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
