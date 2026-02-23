import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { decrypt } from '@/lib/utils/encryption';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase bağlantı bilgileri eksik' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            // Cookie set error
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', options);
          } catch (error) {
            // Cookie remove error
          }
        },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama hatası' },
        { status: 401 }
      );
    }

    const { data: token, error: tokenError } = await supabase
      .from('meta_tokens')
      .select('encrypted_token')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'Meta token bulunamadı' },
        { status: 404 }
      );
    }

    const accessToken = decrypt(token.encrypted_token);

    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id,account_status&access_token=${accessToken}`
    );

    if (!adAccountsResponse.ok) {
      return NextResponse.json(
        { error: 'Meta API\'den reklam hesapları alınamadı' },
        { status: 500 }
      );
    }

    const adAccountsData = await adAccountsResponse.json();
    const adAccounts = adAccountsData.data || [];

    return NextResponse.json({
      adAccounts: adAccounts.map((account: any) => ({
        id: account.id,
        accountId: account.account_id,
        name: account.name,
        status: account.account_status,
      })),
    });
  } catch (error) {
    console.error('Ad accounts fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}
