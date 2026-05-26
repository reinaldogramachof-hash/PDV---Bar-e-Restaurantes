// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: jwtError } = await supabaseAdmin.auth.getUser(jwt);
    if (jwtError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();

    if (callerProfile?.role !== 'master') {
      return new Response(JSON.stringify({ error: 'Forbidden: master role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, document, plano, licenseStatus, adminName, adminEmail, adminPassword } = await req.json();
    if (!name || !plano || !licenseStatus || !adminEmail || !adminPassword || !adminName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const empresaId = `empresa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const { data: empresa, error: empresaError } = await supabaseAdmin
      .from('empresas')
      .insert({ id: empresaId, name, document: document ?? null, plano, license_status: licenseStatus })
      .select('*')
      .single();
    if (empresaError) throw new Error(`Erro ao criar empresa: ${empresaError.message}`);

    const { data: { user: newUser }, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });
    if (userError || !newUser) throw new Error(`Erro ao criar usuário: ${userError?.message}`);

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({ id: newUser.id, empresa_id: empresaId, name: adminName, role: 'admin', active: true });
    if (profileError) throw new Error(`Erro ao criar perfil: ${profileError.message}`);

    return new Response(JSON.stringify(empresa), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
