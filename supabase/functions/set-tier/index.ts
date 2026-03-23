import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  // Validate the calling user's JWT
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  // Validate request body
  let tier: 'free' | 'premium'
  try {
    const body = await req.json() as { tier?: unknown }
    if (body.tier !== 'free' && body.tier !== 'premium') {
      return new Response('Invalid tier', { status: 400, headers: corsHeaders })
    }
    tier = body.tier
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders })
  }

  // Use service-role client — bypasses RLS, the only path allowed to write tier
  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const { error } = await serviceClient
    .from('profiles')
    .update({ tier })
    .eq('id', user.id)

  if (error) {
    return new Response(error.message, { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
