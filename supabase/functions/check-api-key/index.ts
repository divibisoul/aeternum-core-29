import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function n07Available(): Promise<boolean> {
  const baseUrl = String(Deno.env.get('N07_BACKEND_URL') ?? Deno.env.get('SOUL_N07_URL') ?? '').trim().replace(/\/$/, '');
  const token = String(Deno.env.get('N07_APP_TOKEN') ?? '').trim();
  if (!baseUrl || !token) return false;
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = String(Deno.env.get('SUPABASE_URL') ?? '').trim();
    const serviceKey = String(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
    const supabase = supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;
    const authHeader = req.headers.get('Authorization') ?? '';

    const userProviders: string[] = [];
    if (supabase && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          const { data: keys } = await supabase
            .from('api_keys')
            .select('provider')
            .eq('user_id', user.id)
            .eq('is_active', true);
          for (const item of keys ?? []) {
            if (typeof item.provider === 'string' && item.provider.trim()) userProviders.push(item.provider.trim());
          }
        }
      }
    }

    const providers = [...new Set(userProviders)];
    if (await n07Available()) providers.unshift('n07');
    const uniqueProviders = [...new Set(providers)];
    return new Response(JSON.stringify({
      hasKey: uniqueProviders.length > 0,
      keys: uniqueProviders,
      unifiedBackend: uniqueProviders.includes('n07'),
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[check-api-key] Error:', error);
    return new Response(JSON.stringify({ hasKey: false, keys: [], unifiedBackend: false }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
