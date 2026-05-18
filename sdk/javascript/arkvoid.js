/**
 * ARKVOID JavaScript SDK
 * Works in Node.js and browsers.
 * 
 * Install: npm install arkvoid-sdk
 * Or use directly: copy this file
 */

const ARKVOID_BASE_URL = 'https://arkvoid.cherazen.com/api/v1'

class ArkvoidClient {
  constructor({ apiKey, agent = null, silent = false } = {}) {
    if (!apiKey?.startsWith('ARK_')) {
      throw new Error('API key must start with ARK_. Get yours at arkvoid.cherazen.com')
    }
    this.apiKey = apiKey
    this.defaultAgent = agent
    this.silent = silent
  }
  
  async trace({
    action,
    riskLevel = 'low',
    agent = null,
    riskScore = null,
    metadata = null,
    durationMs = null,
  }) {
    const agentSlug = agent || this.defaultAgent
    if (!agentSlug) {
      if (this.silent) return null
      throw new Error('Agent slug required.')
    }
    
    const payload = {
      agent_slug: agentSlug,
      action,
      risk_level: riskLevel,
      ...(riskScore !== null && { risk_score: Math.max(0, Math.min(100, riskScore)) }),
      ...(metadata && { metadata }),
      ...(durationMs !== null && { duration_ms: durationMs }),
    }
    
    try {
      const res = await fetch(`${ARKVOID_BASE_URL}/traces`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'arkvoid-js/1.0.0',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      
      return await res.json()
    } catch (e) {
      if (!this.silent) {
        console.warn(`[ARKVOID] Failed to send trace:`, e.message)
      }
      return null
    }
  }
  
  // Wrap any async function with automatic tracing
  wrap(fn, options = {}) {
    const { action = fn.name, riskLevel = 'low' } = options
    const client = this
    return async function(...args) {
      const start = Date.now()
      try {
        const result = await fn.apply(this, args)
        client.trace({
          action: action || 'function_call',
          riskLevel,
          durationMs: Date.now() - start,
          metadata: { success: true, function: fn.name }
        })
        return result
      } catch (error) {
        client.trace({
          action: action || 'function_call',
          riskLevel: 'high',
          durationMs: Date.now() - start,
          metadata: { success: false, error: error.message, function: fn.name }
        })
        throw error
      }
    }
  }
}

// Simple one-liner helper
function createArkvoidTracer(apiKey, defaultAgent) {
  const client = new ArkvoidClient({ apiKey, agent: defaultAgent, silent: true })
  return (action, options = {}) => client.trace({ action, ...options })
}

module.exports = { ArkvoidClient, createArkvoidTracer }
