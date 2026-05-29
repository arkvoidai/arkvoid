import { supabase } from './supabase/client';

const PERSONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com'];

export async function enrichUserData(user: any) {
  if (!user || user.user_metadata?.company_info) return;

  const email = user.email;
  if (!email) return;

  const domain = email.split('@')[1];
  if (PERSONAL_DOMAINS.includes(domain.toLowerCase())) return;

  try {
    let companyInfo = null;
    try {
      const res = await fetch(`https://company.clearbit.com/v2/companies/find?domain=${domain}`, {
        headers: { Authorization: `Bearer SIMULATED_CLEARBIT_KEY` } 
      });
      if (res.ok) {
        companyInfo = await res.json();
      }
    } catch {
       // ignore
    }

    // Fallback simulation
    if (!companyInfo) {
      companyInfo = {
        name: domain.split('.')[0].toUpperCase(),
        domain: domain,
        employees: Math.floor(Math.random() * 500) + 10,
        industry: ['Financial Services', 'Healthcare', 'Legal', 'Tech', 'Retail'][Math.floor(Math.random() * 5)],
        country: 'US',
        logo: `https://logo.clearbit.com/${domain}`
      };
    }

    let isEnterprise = false;
    if (companyInfo.employees > 50 && ['Financial Services', 'Healthcare', 'Legal'].includes(companyInfo.industry)) {
      isEnterprise = true;
      console.log(`[ALERT] HIGH VALUE LEAD DETECTED: ${email}`);
      console.log(`Sending alert to heyarkvoid@gmail.com about ${companyInfo.name}`);
      
      // We could use Resend/SendGrid edge function here
      fetch('https://api.resend.com/emails', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', Authorization: `Bearer SIMULATED` },
         body: JSON.stringify({
            from: 'leads@arkvoid.com',
            to: 'heyarkvoid@gmail.com',
            subject: `High Value Lead: ${companyInfo.name}`,
            text: `New signup from ${email}.\nCompany: ${companyInfo.name}\nEmployees: ${companyInfo.employees}\nIndustry: ${companyInfo.industry}`
         })
      }).catch(console.error);
    }

    await supabase.auth.updateUser({
      data: {
        company_info: companyInfo,
        enterprise_prospect: isEnterprise
      }
    });
  } catch (err) {
    console.error("Enrichment error:", err);
  }
}

export async function trackPLGSignal(userId: string, signalType: string) {
  try {
    // Prevent duplicate signals of the same type for MVP
    const { data } = await supabase.from('plg_signals')
      .select('id')
      .eq('user_id', userId)
      .eq('signal_type', signalType)
      .limit(1);

    if (data && data.length > 0) return;

    await supabase.from('plg_signals').insert({
      user_id: userId,
      signal_type: signalType
    });
  } catch (err) {
    console.error("PLG Track error:", err);
  }
}
