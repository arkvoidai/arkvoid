import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY || '';
const client = new Mistral({ apiKey });

export async function riskScoreAction(actionData: any) {
  if (!apiKey) return { risk_score: 0.1, flags: [], requires_review: false };
  
  const prompt = `Analyze this action for risk (0.0 to 1.0). Return ONLY JSON: {"risk_score": 0.0, "flags": ["reason1"], "requires_review": false}. Data: ${JSON.stringify(actionData)}`;
  
  try {
    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      responseFormat: { type: 'json_object' }
    });
    
    const content = response.choices?.[0]?.message?.content;
    if (typeof content === 'string') {
        const parsed = JSON.parse(content);
        return {
        risk_score: parsed.risk_score || 0,
        flags: parsed.flags || [],
        requires_review: parsed.requires_review || false
        };
    }
  } catch (error) {
    console.error('Mistral Risk Scoring Error:', error);
  }
  return { risk_score: 0.2, flags: ['error_analyzing'], requires_review: true };
}

export async function analyzeAnomaly(summary: string) {
  if (!apiKey) return "Anomaly analysis disabled (no API key).";
  try {
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: `Analyze this anomaly summary and provide a root cause analysis report: ${summary}` }]
    });
    return response.choices?.[0]?.message?.content || "";
  } catch (error) {
    return "Error generating analysis.";
  }
}

export async function nlToSql(query: string, orgId: string) {
  return "SELECT * FROM action_logs LIMIT 10;"; // Simplified for now
}

export async function generateComplianceReport(weekData: any) {
  if (!apiKey) return "# Arkvoid Intelligence Compliance Report\n\nNo API key configured for full analysis.";
  try {
    const prompt = `Generate an executive compliance report in Markdown format based on this weekly data: ${JSON.stringify(weekData)}`;
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }]
    });
    return response.choices?.[0]?.message?.content || "";
  } catch (error) {
    return "Error generating report.";
  }
}

export async function generateFormalComplianceReport(data: any) {
  if (!apiKey) return "API Key not configured. Please add MISTRAL_API_KEY to your environment.";
  
  const systemPrompt = `You are an EU AI Act compliance expert. 
Write a formal compliance report in HTML format. Use professional regulatory language.
Format with clear sections. Be specific about the data provided. Use the following HTML structural tags: <h1>, <h2>, <p>, <ul>, <li>, <strong>.
Do not use Markdown. Output ONLY HTML (no markdown code blocks).`;

  const prompt = `Generate EU AI Act compliance report:
Organization: ${data.org_email}
Period: ${data.period}
AI Systems monitored: ${data.agents.join(', ')}
Total actions audited: ${data.trace_count}
Compliance score: ${data.score}%
Risk events: ${data.high_risk} high-risk, ${data.medium_risk} medium-risk
No critical violations: ${data.critical_violations === 0 ? 'true' : 'false'}

Include these sections strictly:
1. Executive Summary
2. AI Systems Inventory (EU AI Act Article 13)
3. Risk Classification Assessment (Annex III)
4. Transparency Obligations Status (Article 52)
5. Human Oversight Mechanisms (Article 14)
6. Audit Trail Evidence (Article 12)
7. Compliance Gaps and Recommendations
8. Certification Statement

Max 600 words. Be formal and specific.`;

  try {
    const response = await client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ]
    });
    const content = response.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.replace(/```html|```/g, '').trim() : "";
  } catch (error) {
    return "<p>Error generating report.</p>";
  }
}

export async function generateAuditReport(traces: any[], agentId: string) {
  if (!apiKey) return "API Key not configured.";
  try {
    const prompt = `Generate a short audit summary based on these recent traces for agent ${agentId}: ${JSON.stringify(traces.slice(0, 5))}`;
    const response = await client.chat.complete({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }]
    });
    return typeof response.choices?.[0]?.message?.content === 'string' ? response.choices?.[0]?.message?.content : "";
  } catch (error) {
    return "Error generating audit report.";
  }
}

export async function chatWithArkvoid(messages: {role: string, content: string | any[]}[], context: any) {
    if (!apiKey) return new ReadableStream({
        start(controller) {
            controller.enqueue(new TextEncoder().encode("data: " + JSON.stringify({ message: "Mistral API key not configured." }) + "\n\n"));
            controller.close();
        }
    });

    const systemPrompt = `You are Arkvoid Intelligence, an AI Governance assistant built into the ARKVOID platform. 
    You never mention that you are a Mistral AI model. You answer questions about traces, agents, and compliance.
    Context: ${JSON.stringify(context)}`;

    const fullMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
    ] as any;

    const responseStream = await client.chat.stream({
        model: 'mistral-large-latest',
        messages: fullMessages,
    });

    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of responseStream) {
                    const content = chunk.data.choices[0].delta.content;
                    if (content) {
                        controller.enqueue(encoder.encode("data: " + JSON.stringify({ text: content }) + "\n\n"));
                    }
                }
                controller.close();
            } catch (e) {
                console.error("Stream error:", e);
                controller.close();
            }
        }
    });
}
