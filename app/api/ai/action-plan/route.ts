import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';
import { buildActionPlanPrompt } from '@/lib/gemini/prompts';

export const dynamic = 'force-dynamic';

interface ActionPlanItem {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: string;
}

/**
 * POST /api/ai/action-plan
 * 
 * Generates AI-powered action plan for a client
 * 
 * Request body:
 * - clientId: UUID of the client
 * 
 * Returns:
 * - Array of 3 action items with priority and expected impact
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
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'Müşteri ID gerekli' },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('client_id, name, industry')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Fetch recent metrics for this client (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get campaigns for this client
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('campaign_id')
      .eq('client_id', clientId);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json(
        { error: 'Kampanyalar alınırken hata oluştu' },
        { status: 500 }
      );
    }

    const campaignIds = campaigns?.map((c: any) => c.campaign_id) || [];

    if (campaignIds.length === 0) {
      return NextResponse.json(
        { error: 'Bu müşteri için kampanya bulunamadı' },
        { status: 404 }
      );
    }

    // Get ad sets for these campaigns
    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('ad_set_id, budget')
      .in('campaign_id', campaignIds);

    const adSetIds = adSets?.map((as: any) => as.ad_set_id) || [];

    if (adSetIds.length === 0) {
      return NextResponse.json(
        { error: 'Bu müşteri için reklam seti bulunamadı' },
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
        { error: 'Bu müşteri için reklam bulunamadı' },
        { status: 404 }
      );
    }

    // Get metrics for last 7 days
    const { data: metrics, error: metricsError } = await supabase
      .from('meta_metrics')
      .select('spend, roas, conversions, frequency, add_to_cart, purchases, cpc, ctr')
      .in('ad_id', adIds)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0]);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Metrikler alınırken hata oluştu' },
        { status: 500 }
      );
    }

    if (!metrics || metrics.length === 0) {
      return NextResponse.json(
        { error: 'Bu müşteri için metrik verisi bulunamadı' },
        { status: 404 }
      );
    }

    // Aggregate metrics
    const totalSpend = metrics.reduce((sum: number, m: any) => sum + (m.spend || 0), 0);
    const avgRoas = metrics.reduce((sum: number, m: any) => sum + (m.roas || 0), 0) / metrics.length;
    const totalConversions = metrics.reduce((sum: number, m: any) => sum + (m.conversions || 0), 0);
    const avgFrequency = metrics.reduce((sum: number, m: any) => sum + (m.frequency || 0), 0) / metrics.length;
    const totalAddToCart = metrics.reduce((sum: number, m: any) => sum + (m.add_to_cart || 0), 0);
    const totalPurchases = metrics.reduce((sum: number, m: any) => sum + (m.purchases || 0), 0);
    const avgCpc = metrics.reduce((sum: number, m: any) => sum + (m.cpc || 0), 0) / metrics.length;
    const avgCtr = metrics.reduce((sum: number, m: any) => sum + (m.ctr || 0), 0) / metrics.length;

    // Calculate budget utilization
    const totalBudget = adSets?.reduce((sum: number, as: any) => sum + (as.budget || 0), 0) || 0;
    const budgetUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

    // Get lead quality data for these campaigns
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

    // Build prompt context
    const promptContext = {
      clientName: client.name,
      industry: client.industry,
      totalSpend,
      roas: avgRoas,
      conversions: totalConversions,
      budgetUtilization,
      frequency: avgFrequency,
      addToCart: totalAddToCart,
      purchases: totalPurchases,
      cpc: avgCpc,
      ctr: avgCtr,
      leadQuality,
    };

    // Generate action plan using Gemini API
    const geminiClient = getGeminiClient();
    const prompt = buildActionPlanPrompt(promptContext);

    let actionPlan: ActionPlanItem[];
    try {
      actionPlan = await geminiClient.generateJSON<ActionPlanItem[]>(
        prompt,
        TOKEN_LIMITS.ACTION_PLAN
      );

      // Validate response structure
      if (!Array.isArray(actionPlan) || actionPlan.length !== 3) {
        throw new Error('Invalid action plan structure');
      }

      // Validate each action item
      for (const item of actionPlan) {
        if (!item.action || !item.priority || !item.expected_impact) {
          throw new Error('Invalid action item structure');
        }
        if (!['high', 'medium', 'low'].includes(item.priority)) {
          throw new Error('Invalid priority value');
        }
      }
    } catch (error) {
      console.error('Error generating action plan:', error);
      return NextResponse.json(
        { error: 'Aksiyon planı oluşturulurken hata oluştu' },
        { status: 500 }
      );
    }

    // Store action plan in database
    const { data: recommendation, error: insertError } = await supabase
      .from('ai_recommendations')
      .insert({
        client_id: clientId,
        recommendation_type: 'action_plan',
        content: actionPlan,
        priority: 'high', // Action plans are always high priority
        status: 'active',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing action plan:', insertError);
      return NextResponse.json(
        { error: 'Aksiyon planı kaydedilirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recommendation_id: recommendation.recommendation_id,
      action_plan: actionPlan,
    });
  } catch (error) {
    console.error('Error in action plan generation:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
