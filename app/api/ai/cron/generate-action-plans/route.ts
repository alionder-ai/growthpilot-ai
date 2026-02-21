import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';
import { buildActionPlanPrompt } from '@/lib/gemini/prompts';

export const dynamic = 'force-dynamic';

interface ActionPlanItem {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: string;
}

/**
 * GET /api/ai/cron/generate-action-plans
 * 
 * Cron job that generates action plans for all active clients
 * Runs daily at 01:00 UTC
 * 
 * This endpoint uses service role key to bypass RLS and process all users
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, allow requests without cron secret
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Yetkisiz erişim' },
          { status: 401 }
        );
      }
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all active clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('client_id, name, industry, user_id');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json(
        { error: 'Müşteriler alınırken hata oluştu', details: clientsError.message },
        { status: 500 }
      );
    }

    if (!clients || clients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aktif müşteri bulunamadı',
        processed: 0,
      });
    }

    const geminiClient = getGeminiClient();
    const results = {
      total: clients.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Calculate date range (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateThreshold = sevenDaysAgo.toISOString().split('T')[0];

    // Process each client
    for (const client of clients) {
      try {
        // Get campaigns for this client
        const { data: campaigns } = await supabase
          .from('campaigns')
          .select('campaign_id')
          .eq('client_id', client.client_id);

        if (!campaigns || campaigns.length === 0) {
          console.log(`No campaigns for client ${client.name}, skipping`);
          continue;
        }

        const campaignIds = campaigns.map((c) => c.campaign_id);

        // Get ad sets
        const { data: adSets } = await supabase
          .from('ad_sets')
          .select('ad_set_id, budget')
          .in('campaign_id', campaignIds);

        if (!adSets || adSets.length === 0) {
          console.log(`No ad sets for client ${client.name}, skipping`);
          continue;
        }

        const adSetIds = adSets.map((as) => as.ad_set_id);

        // Get ads
        const { data: ads } = await supabase
          .from('ads')
          .select('ad_id')
          .in('ad_set_id', adSetIds);

        if (!ads || ads.length === 0) {
          console.log(`No ads for client ${client.name}, skipping`);
          continue;
        }

        const adIds = ads.map((a) => a.ad_id);

        // Get metrics for last 7 days
        const { data: metrics } = await supabase
          .from('meta_metrics')
          .select('spend, roas, conversions, frequency, add_to_cart, purchases, cpc, ctr')
          .in('ad_id', adIds)
          .gte('date', dateThreshold);

        if (!metrics || metrics.length === 0) {
          console.log(`No metrics for client ${client.name}, skipping`);
          continue;
        }

        // Aggregate metrics
        const totalSpend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0);
        const avgRoas = metrics.reduce((sum, m) => sum + (m.roas || 0), 0) / metrics.length;
        const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
        const avgFrequency = metrics.reduce((sum, m) => sum + (m.frequency || 0), 0) / metrics.length;
        const totalAddToCart = metrics.reduce((sum, m) => sum + (m.add_to_cart || 0), 0);
        const totalPurchases = metrics.reduce((sum, m) => sum + (m.purchases || 0), 0);
        const avgCpc = metrics.reduce((sum, m) => sum + (m.cpc || 0), 0) / metrics.length;
        const avgCtr = metrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / metrics.length;

        // Calculate budget utilization
        const totalBudget = adSets.reduce((sum, as) => sum + (as.budget || 0), 0);
        const budgetUtilization = totalBudget > 0 ? (totalSpend / totalBudget) * 100 : 0;

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
        };

        // Generate action plan
        const prompt = buildActionPlanPrompt(promptContext);
        const actionPlan = await geminiClient.generateJSON<ActionPlanItem[]>(
          prompt,
          TOKEN_LIMITS.ACTION_PLAN
        );

        // Validate response
        if (!Array.isArray(actionPlan) || actionPlan.length !== 3) {
          throw new Error('Invalid action plan structure');
        }

        // Store action plan
        const { error: insertError } = await supabase
          .from('ai_recommendations')
          .insert({
            client_id: client.client_id,
            recommendation_type: 'action_plan',
            content: actionPlan,
            priority: 'high',
            status: 'active',
          });

        if (insertError) {
          throw insertError;
        }

        results.successful++;
        console.log(`Generated action plan for client ${client.name}`);
      } catch (error) {
        results.failed++;
        const errorMessage = `Client ${client.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Aksiyon planları oluşturuldu',
      results,
    });
  } catch (error) {
    console.error('Error in action plan cron job:', error);
    return NextResponse.json(
      { 
        error: 'Beklenmeyen bir hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
