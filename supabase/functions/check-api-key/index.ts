import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      // Check if LOVABLE_API_KEY exists (system-level key)
      const hasLovableKey = !!Deno.env.get('LOVABLE_API_KEY');
      console.log('[check-api-key] No auth header, checking system key:', hasLovableKey);
      
      return new Response(
        JSON.stringify({ hasKey: hasLovableKey, keys: hasLovableKey ? ['lovable'] : [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      // Even without valid auth, we have the Lovable API key
      const hasLovableKey = !!Deno.env.get('LOVABLE_API_KEY');
      console.log('[check-api-key] Invalid auth, using system key:', hasLovableKey);
      
      return new Response(
        JSON.stringify({ hasKey: hasLovableKey, keys: hasLovableKey ? ['lovable'] : [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check user's API keys
    const { data: keys, error } = await supabase
      .from('api_keys')
      .select('provider, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error) {
      console.error('[check-api-key] DB error:', error);
    }

    const userKeys = keys?.map(k => k.provider) || [];
    
    // Always include lovable if the system key exists
    const hasLovableKey = !!Deno.env.get('LOVABLE_API_KEY');
    if (hasLovableKey && !userKeys.includes('lovable')) {
      userKeys.push('lovable');
    }

    console.log('[check-api-key] User', user.id, 'has keys:', userKeys);

    return new Response(
      JSON.stringify({ hasKey: userKeys.length > 0, keys: userKeys }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[check-api-key] Error:', error);
    
    // Fallback: check if Lovable key exists
    const hasLovableKey = !!Deno.env.get('LOVABLE_API_KEY');
    
    return new Response(
      JSON.stringify({ hasKey: hasLovableKey, keys: hasLovableKey ? ['lovable'] : [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
