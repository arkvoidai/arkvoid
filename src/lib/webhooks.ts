import { supabase } from '@/src/lib/supabase/client';

export async function deliverWebhook(event_type: string, payload: object, userId: string) {
  // Get all active webhooks for this user that listen to this event
  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .contains('events', [event_type]);
  
  if (!webhooks || webhooks.length === 0) return;
  
  for (const webhook of webhooks) {
    const start = Date.now();
    try {
      const signatureStr = async (dataStr: string, sec: string) => {
        const encoder = new TextEncoder();
        const keyBuf = await crypto.subtle.importKey(
          'raw', encoder.encode(sec), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', keyBuf, encoder.encode(dataStr));
        return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      const payloadStr = JSON.stringify({
        event: event_type,
        timestamp: new Date().toISOString(),
        data: payload,
        workspace: userId,
      });

      const sigStr = await signatureStr(payloadStr, webhook.secret);

      // In production this would be a server-side worker
      // For now, attempt delivery from client
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Arkvoid-Event': event_type,
          'X-Arkvoid-Signature': sigStr,
          'X-Arkvoid-Timestamp': Date.now().toString(),
        },
        body: payloadStr,
        signal: AbortSignal.timeout(5000),
      });
      
      const responseBodyText = await response.text().catch(() => '');

      // Log delivery
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type,
        payload,
        response_status: response.status,
        response_body: responseBodyText.substring(0, 1000),
        success: response.ok,
        duration_ms: Date.now() - start,
      });

      // Update counters
      const { data: currentWH } = await supabase.from('webhooks').select('delivery_count, failure_count').eq('id', webhook.id).single();
      if (currentWH) {
        if (response.ok) {
           await supabase.from('webhooks').update({ 
               delivery_count: (currentWH.delivery_count || 0) + 1,
               last_delivered_at: new Date().toISOString()
           }).eq('id', webhook.id);
        } else {
           await supabase.from('webhooks').update({ failure_count: (currentWH.failure_count || 0) + 1 }).eq('id', webhook.id);
        }
      }

    } catch (e: any) {
      await supabase.from('webhook_deliveries').insert({
        webhook_id: webhook.id,
        event_type,
        payload,
        success: false,
        response_body: e.message,
        duration_ms: Date.now() - start,
      });
      const { data: currentWH } = await supabase.from('webhooks').select('failure_count').eq('id', webhook.id).single();
      if (currentWH) {
         await supabase.from('webhooks').update({ failure_count: (currentWH.failure_count || 0) + 1 }).eq('id', webhook.id);
      }
    }
  }
}
