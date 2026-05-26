import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { callGemini, parseGeminiJSON } from '@/lib/gemini'
import { AGENT_PROMPTS, AGENT_CREDIT_COSTS } from '@/lib/agents'
import { RunWorkflowRequest, RunWorkflowResponse } from '@/types'
import { z } from 'zod'

const RunWorkflowSchema = z.object({
  agentSlug: z.string().min(1),
  inputData: z.record(z.unknown()),
})

// Rate limiting: max 10 runs per user per hour
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 10

export async function POST(req: NextRequest): Promise<NextResponse<RunWorkflowResponse>> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ workflowId: '', status: 'failed', error: 'Unauthorized' }, { status: 401 })

  // Parse body
  let body: RunWorkflowRequest
  try {
    body = RunWorkflowSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ workflowId: '', status: 'failed', error: 'Invalid request body' }, { status: 400 })
  }

  // Get user
  const { data: user } = await supabaseAdmin.from('users').select('id, plan').eq('clerk_id', userId).single()
  if (!user) return NextResponse.json({ workflowId: '', status: 'failed', error: 'User not found' }, { status: 404 })

  // Get agent
  const { data: agent } = await supabaseAdmin.from('agents').select('*').eq('slug', body.agentSlug).eq('is_enabled', true).single()
  if (!agent) return NextResponse.json({ workflowId: '', status: 'failed', error: 'Agent not found or disabled' }, { status: 404 })

  // Rate limiting
  const { count: recentRuns } = await supabaseAdmin
    .from('workflows')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())

  if ((recentRuns || 0) >= RATE_LIMIT_MAX) {
    return NextResponse.json({ workflowId: '', status: 'failed', error: 'Rate limit exceeded. Try again later.' }, { status: 429 })
  }

  // Check credits
  const { data: wallet } = await supabaseAdmin.from('credit_wallets').select('*').eq('user_id', user.id).single()
  if (!wallet) return NextResponse.json({ workflowId: '', status: 'failed', error: 'Wallet not found' }, { status: 400 })

  const remaining = wallet.total_credits - wallet.used_credits
  if (remaining < agent.credit_cost) {
    return NextResponse.json({ workflowId: '', status: 'failed', error: 'Insufficient credits' }, { status: 402 })
  }

  // Create workflow record
  const { data: workflow, error: wfError } = await supabaseAdmin.from('workflows').insert({
    user_id: user.id,
    agent_id: agent.id,
    status: 'running',
    input_data: body.inputData,
    started_at: new Date().toISOString(),
  }).select().single()

  if (wfError || !workflow) {
    return NextResponse.json({ workflowId: '', status: 'failed', error: 'Failed to create workflow' }, { status: 500 })
  }

  try {
    // Build prompt
    const promptTemplate = AGENT_PROMPTS[body.agentSlug]
    let prompt = promptTemplate || `Process this task for agent ${body.agentSlug}:\n${JSON.stringify(body.inputData, null, 2)}`

    // Interpolate input data into prompt
    for (const [key, value] of Object.entries(body.inputData)) {
      prompt = prompt.replace(`{${key}}`, String(value))
    }

    // For LinkedIn agent: fetch GitHub repo data first
    if (body.agentSlug === 'linkedin-tech-post' && body.inputData.github_url) {
      const repoData = await fetchGitHubRepo(String(body.inputData.github_url))
      prompt = prompt.replace('{repo_data}', repoData)
    }

    // Call Gemini
    const result = await callGemini(prompt)
    const outputData = parseGeminiJSON<Record<string, unknown>>(result.text)

    // Deduct credits atomically
    const { data: deducted } = await supabaseAdmin.rpc('deduct_credits', {
      p_user_id: user.id,
      p_workflow_id: workflow.id,
      p_agent_id: agent.id,
      p_amount: agent.credit_cost,
      p_description: `${agent.title} run`,
    })

    if (!deducted) {
      // Race condition: credits ran out
      await supabaseAdmin.from('workflows').update({ status: 'failed', error_message: 'Insufficient credits' }).eq('id', workflow.id)
      return NextResponse.json({ workflowId: workflow.id, status: 'failed', error: 'Insufficient credits' }, { status: 402 })
    }

    // Mark workflow complete
    await supabaseAdmin.from('workflows').update({
      status: 'completed',
      output_data: outputData,
      credits_used: agent.credit_cost,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      completed_at: new Date().toISOString(),
    }).eq('id', workflow.id)

    return NextResponse.json({
      workflowId: workflow.id,
      status: 'completed',
      output: {
        ...outputData,
        token_usage: { input: result.inputTokens, output: result.outputTokens },
      } as never,
      creditsUsed: agent.credit_cost,
    })

  } catch (err) {
    // Mark workflow failed
    await supabaseAdmin.from('workflows').update({
      status: 'failed',
      error_message: err instanceof Error ? err.message : 'Unknown error',
    }).eq('id', workflow.id)

    return NextResponse.json({
      workflowId: workflow.id,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Workflow execution failed',
    }, { status: 500 })
  }
}

async function fetchGitHubRepo(url: string): Promise<string> {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return 'Repository not found'

  const [, owner, repo] = match
  const repoClean = repo.replace('.git', '')

  try {
    const headers: Record<string, string> = { 'User-Agent': 'WorkforceAI/1.0' }

    const [repoRes, readmeRes] = await Promise.all([
      fetch(`https://api.github.com/repos/${owner}/${repoClean}`, { headers }),
      fetch(`https://api.github.com/repos/${owner}/${repoClean}/readme`, { headers }),
    ])

    const repoData = repoRes.ok ? await repoRes.json() : {}
    let readme = ''
    if (readmeRes.ok) {
      const readmeData = await readmeRes.json()
      readme = Buffer.from(readmeData.content, 'base64').toString('utf8').slice(0, 2000)
    }

    return JSON.stringify({
      name: repoData.name,
      description: repoData.description,
      language: repoData.language,
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      topics: repoData.topics?.slice(0, 10),
      readme: readme,
    })
  } catch {
    return `Repository: ${owner}/${repoClean}`
  }
}
