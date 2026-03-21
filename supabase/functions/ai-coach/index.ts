import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

function buildSystemPrompt(categoryName: string, asisScore: number, tobeScore: number): string {
  return `You are a thoughtful life coach helping a user reflect on their "${categoryName}" life area.
Their current self-assessment: As-Is score ${asisScore}/10, To-Be (goal) score ${tobeScore}/10.

Ask 2-4 reflective questions to understand their situation better before suggesting scores.
Keep responses concise (2-3 sentences per turn). Be warm and encouraging.

When you have enough context (after at least one user response), output your score suggestion in this EXACT format on its own line at the end of your message:
{"type":"score_proposal","asis":X,"tobe":Y}
where X and Y are integers 1-10 based on what they have shared.
Never suggest a score before asking at least one question.`
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  // Validate JWT
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace('Bearer ', '')

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: userData, error: authError } = await supabase.auth.getUser(token)
  if (authError || !userData.user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  // Check premium tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', userData.user.id)
    .single()

  if (profileError || !profile) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  if (profile.tier !== 'premium') {
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  // Parse request body
  let body: {
    categoryName: string
    asisScore: number
    tobeScore: number
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  try {
    body = await req.json()
  } catch {
    return new Response('Bad Request: invalid JSON', { status: 400, headers: corsHeaders })
  }

  const { categoryName, asisScore, tobeScore, messages } = body

  if (!categoryName || asisScore == null || tobeScore == null || !Array.isArray(messages)) {
    return new Response('Bad Request: missing required fields', { status: 400, headers: corsHeaders })
  }

  // Ensure at least one message (Anthropic requires it).
  // On first open the client sends an empty array — inject a silent opener.
  const effectiveMessages =
    messages.length === 0
      ? [{ role: 'user' as const, content: 'Hello, please start our session.' }]
      : messages

  // Initialize Anthropic client
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicApiKey) {
    return new Response('Internal Server Error: missing API key', { status: 500, headers: corsHeaders })
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey })
  const model = Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-haiku-4-5-20251001'

  // Create streaming response
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await anthropic.messages.create({
          model,
          max_tokens: 1024,
          stream: true,
          system: buildSystemPrompt(categoryName, asisScore, tobeScore),
          messages: effectiveMessages,
        })

        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = new TextEncoder().encode(event.delta.text)
            controller.enqueue(chunk)
          }
        }

        controller.close()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Stream error'
        controller.enqueue(new TextEncoder().encode(`\n[Error: ${message}]`))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Transfer-Encoding': 'chunked',
    },
  })
})
