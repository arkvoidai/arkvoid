// ... (imports remain)
import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const pricingPlans = [
{
name: 'DEVELOPER',
price: '$0',
frequency: 'forever',
annualPrice: '$0',
tagline: 'For developers building and testing AI agents',
features: [
{ text: '3 agent identities', included: true },
{ text: '10,000 traces / month', included: true },
{ text: '7-day trace retention', included: true },
{ text: 'Basic trace explorer', included: true },
{ text: 'Cryptographic hashing (SHA-256)', included: true },
{ text: 'REST API access', included: true },
{ text: 'Community Discord support', included: true },
{ text: '1 team member', included: true },
{ text: 'Compliance reports', included: false },
{ text: 'Arkvoid Intelligence AI', included: false },
{ text: 'Data export', included: false },
{ text: 'Priority support', included: false },
],
cta: 'Start Building',
ctaStyle: 'ghost',
note: 'No credit card required'
},
{
name: 'GROWTH',
price: '$19',
frequency: 'mo',
annualPrice: '$15',
annualBillingText: 'billed $180/yr',
tagline: 'For teams running AI agents in production',
mostPopular: true,
features: [
{ text: '10 agent identities', included: true },
{ text: '500,000 traces / month', included: true },
{ text: '30-day trace retention', included: true },
{ text: 'Full trace explorer + search', included: true },
{ text: 'Cryptographic chains (Merkle)', included: true },
{ text: 'Arkvoid Intelligence (risk scoring)', included: true },
{ text: 'Compliance reports (weekly)', included: true },
{ text: 'Data export: PDF + CSV', included: true },
{ text: 'REST API access', included: true },
{ text: 'Email alerts', included: true },
{ text: 'Up to 5 team members', included: true },
{ text: 'Priority email support (48h SLA)', included: true },
{ text: 'Custom retention', included: false },
{ text: 'On-premise / VPC deploy', included: false },
{ text: 'SSO / SAML', included: false },
],
cta: 'Start Free Trial',
ctaStyle: 'filled',
note: '14-day free trial · No credit card'
},
{
name: 'SCALE',
price: '$79',
frequency: 'mo',
annualPrice: '$63',
annualBillingText: 'billed $756/yr',
tagline: 'For engineering teams with advanced governance needs',
features: [
{ text: 'Unlimited agent identities', included: true },
{ text: '10,000,000 traces / month', included: true },
{ text: '1-year trace retention', included: true },
{ text: 'Everything in Growth', included: true },
{ text: 'Compliance reports (daily, ISO 42001 mapped)', included: true },
{ text: 'Custom risk scoring rules', included: true },
{ text: 'Multi-environment support', included: true },
{ text: 'Up to 25 team members', included: true },
{ text: 'RBAC (role-based access control)', included: true },
{ text: 'Data residency: US or EU', included: true },
{ text: 'Priority Slack support (4h SLA)', included: true },
{ text: 'Quarterly compliance review call', included: true },
{ text: 'On-premise / VPC', included: false },
{ text: 'SSO / SAML', included: false },
{ text: 'Custom SLA', included: false },
],
cta: 'Get Started',
ctaStyle: 'ghost',
note: ''
},
{
name: 'ENTERPRISE',
price: 'Custom',
frequency: '',
tagline: 'For regulated industries with compliance mandates',
features: [
{ text: 'Everything in Scale', included: true },
{ text: 'Unlimited traces + custom retention (1-7 years)', included: true },
{ text: 'Full audit export (PDF, CSV, JSON, SIEM)', included: true },
{ text: 'SOC 2 Type II evidence package', included: true },
{ text: 'EU AI Act Article 13 + 22 logs', included: true },
{ text: 'ISO 42001 AI Management System mapping', included: true },
{ text: 'SSO / SAML (Okta, Azure AD, Google)', included: true },
{ text: 'On-premise / VPC deployment', included: true },
{ text: '99.9% uptime SLA (contractual)', included: true },
{ text: 'Dedicated Customer Success Manager', included: true },
{ text: 'Custom contracts + BAA / DPA available', included: true },
],
cta: 'Talk to Sales',
ctaStyle: 'ghost',
link: 'mailto:heyarkvoid@gmail.com',
note: ''
}
];

const faqs = [
{
q: 'How is a "trace" counted?',
a: 'One trace = one complete agent action execution, from input through all tool calls to final output. A single agent session may produce multiple traces if it makes multiple decisions.'
},
{
q: 'Can I switch plans anytime?',
a: 'Yes. Upgrades take effect immediately. Downgrades take effect at your next billing cycle. No lock-in on monthly plans.'
},
{
q: 'Do unused traces roll over?',
a: 'No. Monthly traces reset on your billing date. Enterprise plans can negotiate trace banking.'
},
{
q: 'How does the 14-day trial work?',
a: "You get full Growth-plan access for 14 days. No credit card required to start. At day 14, you're prompted to upgrade or automatically move to the Developer tier — no data loss."
},
{
q: 'What's your refund policy?',
a: 'Monthly plans: 7-day refund window from charge date. Annual plans: 30-day full refund, then pro-rated for the remainder.'
},
{
q: 'Is ARKVOID available in my country?',
a: 'Yes. We serve customers globally. Stripe handles payments in 135+ countries. EU customers receive EUR invoices with VAT applied.'
},
{
q: 'Does on-premise deployment affect pricing?',
a: 'Yes. On-premise is Enterprise only and priced based on infrastructure scope and support requirements. Contact sales.'
},
{
q: 'Do you offer discounts for startups or nonprofits?',
a: 'Yes — 40% off Growth and Scale plans for companies under $1M ARR. Contact heyarkvoid@gmail.com with your details.'
}
];

export function Pricing() {
const [isAnnual, setIsAnnual] = useState(true);
const [activeCard, setActiveCard] = useState(0);

const containerRef = React.useRef<HTMLDivElement>(null);

const currentPrice = (plan: any) => {
if (plan.price === 'Custom') return plan.price;
return isAnnual ? plan.annualPrice : plan.price;
};

const currentBillingText = (plan: any) => {
if (isAnnual && plan.annualBillingText) return plan.annualBillingText;
return '';
};

const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
if (!containerRef.current) return;
const scrollLeft = e.currentTarget.scrollLeft;
const cardWidth = containerRef.current.scrollWidth / 4;
const newActive = Math.round(scrollLeft / cardWidth);
if (newActive !== activeCard && newActive >= 0 && newActive < 4) {
setActiveCard(newActive);
}
};

return (
<div className="bg-black min-h-screen pt-32 pb-24 text-white font-sans">
<Helmet>
<title>Pricing: AI Governance Infrastructure | ARKVOID</title>
<meta name="description" content="Start free with 3 agents and scale to enterprise. Transparent pricing for AI audit trails and governance." />
</Helmet>

<div className="max-w-[1200px] mx-auto px-6">  
    <div className="text-center mb-16">  
      <h1 className="text-[clamp(34px,9vw,76px)] font-bold tracking-[-0.03em] mb-8">  
        Simple pricing. Serious governance.  
      </h1>  

      <div className="inline-flex items-center gap-1 p-1 bg-[rgba(255,255,255,0.06)] rounded-[980px]">  
        <button   
          className={`px-5 py-2 text-[13px] rounded-[980px] transition-colors ${!isAnnual ? 'bg-white text-black font-[600]' : 'text-[#6E6E73] font-normal'}`}  
          onClick={() => setIsAnnual(false)}  
        >  
          Monthly  
        </button>  
        <button   
          className={`px-5 py-2 text-[13px] rounded-[980px] transition-colors flex items-center gap-2 ${isAnnual ? 'bg-white text-black font-[600]' : 'text-[#6E6E73] font-normal'}`}  
          onClick={() => setIsAnnual(true)}  
        >  
          Annual <span className="text-[11px] bg-[rgba(52,211,153,0.15)] text-[#34D399] px-[8px] py-[3px] rounded-[980px]">Save 20%</span>  
        </button>  
      </div>  
    </div>  

    {/* Mobile Carousel & Desktop Grid */}  
    <div   
      className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-4 gap-6 pb-8 hide-scrollbar"  
      onScroll={handleScroll}  
      ref={containerRef}  
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}  
    >  
      {pricingPlans.map((plan, i) => (  
        <div   
          key={plan.name}   
          className={`min-w-[90vw] md:min-w-0 snap-start bg-[#0A0A0A] border rounded-2xl p-8 flex flex-col relative transition-all duration-300 ${  
            plan.mostPopular   
              ? 'border-[#F59E0B] md:scale-[1.03] shadow-[0_0_60px_rgba(245,158,11,0.08),0_0_0_1px_rgba(245,158,11,0.15)] z-10'   
              : 'border-[rgba(255,255,255,0.1)] hover:-translate-y-1 hover:shadow-2xl'  
          }`}  
        >  
          {plan.mostPopular && (  
            <div className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-[#F59E0B] text-black text-[10px] font-bold uppercase tracking-[0.1em] px-[14px] py-[5px] rounded-[980px]">  
              Most Popular  
            </div>  
          )}  
            
          <h3 className="text-[20px] font-bold text-white mb-2">{plan.name}</h3>  
          <p className="text-[14px] text-[#A1A1A6] mb-6 h-[40px]">{plan.tagline}</p>  
            
          <div className="mb-8">  
            {plan.price === 'Custom' ? (  
              <div className="text-[48px] font-bold text-white tracking-[-0.04em]">Custom</div>  
            ) : (  
              <div className="flex items-baseline gap-1">  
                <span className="text-[48px] font-bold text-white tracking-[-0.04em]">{currentPrice(plan)}</span>  
                <span className="text-[16px] text-[#6E6E73]">/ {plan.frequency}</span>  
              </div>  
            )}  
            {currentBillingText(plan) && (  
              <div className="text-[12px] text-[#6E6E73] mt-1">{currentBillingText(plan)}</div>  
            )}  
          </div>  

          {plan.link?.startsWith('mailto') ? (  
            <a   
              href={plan.link}  
              className={`block w-full py-3 rounded-[980px] text-center text-[14px] font-[600] transition-all mb-2 ${  
                plan.ctaStyle === 'filled'   
                  ? 'bg-[#F59E0B] text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.2)]'   
                  : 'bg-transparent border border-white text-white hover:bg-[rgba(255,255,255,0.05)]'  
              }`}  
            >  
              {plan.cta}  
            </a>  
          ) : (  
            <Link  
              to="/auth/signup"  
              className={`block w-full py-3 rounded-[980px] text-center text-[14px] font-[600] transition-all mb-2 ${  
                plan.ctaStyle === 'filled'   
                  ? 'bg-[#F59E0B] text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(245,158,11,0.2)]'   
                  : 'bg-transparent border border-white text-white hover:bg-[rgba(255,255,255,0.05)]'  
              }`}  
            >  
              {plan.cta}  
            </Link>  
          )}  
          <div className="text-[11px] text-[#6E6E73] text-center mb-8 h-[16px]">{plan.note}</div>  

          <ul className="space-y-3 mt-auto">  
            {plan.features.map((feature, idx) => (  
              <li key={idx} className={`flex items-start gap-3 text-[14px] ${feature.included ? 'text-white' : 'text-[#3D3D3D]'}`}>  
                {feature.included ? (  
                  <Check className="w-4 h-4 text-[#34D399] shrink-0 mt-[2px]" />  
                ) : (  
                  <X className="w-4 h-4 text-[#3D3D3D] shrink-0 mt-[2px]" />  
                )}  
                <span>{feature.text}</span>  
              </li>  
            ))}  
          </ul>  
        </div>  
      ))}  
    </div>  

    {/* Mobile Dot Navigation */}  
    <div className="flex md:hidden justify-center gap-2 mb-16">  
      {[0, 1, 2, 3].map((i) => (  
        <div   
          key={i}   
          className={`transition-all duration-300 ${activeCard === i ? 'w-[10px] h-[6px] bg-[#F59E0B] rounded-[3px]' : 'w-[6px] h-[6px] rounded-full bg-[rgba(255,255,255,0.2)]'}`}  
        />  
      ))}  
    </div>  

    <p className="text-[12px] text-[#6E6E73] text-center my-12">  
      Prices in USD. EU customers billed in EUR at current rate. EU VAT applied where required. ARKVOID is available globally.  
    </p>  

    {/* Comparison Table */}  
    <div className="mt-32 max-w-full overflow-x-auto">  
      <h2 className="text-[clamp(26px,6vw,52px)] font-bold text-center mb-16 tracking-[-0.03em]">Not sure which plan? Compare everything.</h2>  
        
      <table className="w-full min-w-[800px] text-left border-collapse">  
        <thead>  
          <tr className="border-b border-[rgba(255,255,255,0.1)]">  
            <th className="py-6 px-4 font-semibold text-[14px]"></th>  
            <th className="py-6 px-4 font-semibold text-[14px]">Developer</th>  
            <th className="py-6 px-4 font-semibold text-[14px]">Growth</th>  
            <th className="py-6 px-4 font-semibold text-[14px]">Scale</th>  
            <th className="py-6 px-4 font-semibold text-[14px]">Enterprise</th>  
          </tr>  
        </thead>  
        <tbody>  
          {/* Infrastructure */}  
          <tr className="bg-[rgba(255,255,255,0.02)]">  
            <td colSpan={5} className="py-3 px-4 text-[12px] font-bold text-[#E8D5B0] tracking-wider uppercase">Infrastructure</td>  
          </tr>  
          <tr className="border-b border-[rgba(255,255,255,0.05)]">  
            <td className="py-4 px-4 text-[14px] text-white">Agent Identities</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">3</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">20</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">Unlimited</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">Unlimited</td>  
          </tr>  
          <tr className="border-b border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.01)]">  
            <td className="py-4 px-4 text-[14px] text-white">Traces per month</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">100K</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">5M</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">50M</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">Unlimited</td>  
          </tr>  
          <tr className="border-b border-[rgba(255,255,255,0.05)]">  
            <td className="py-4 px-4 text-[14px] text-white">Trace Retention</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">7 days</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">90 days</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">1 year</td>  
            <td className="py-4 px-4 text-[14px] text-[#A1A1A6]">Custom (1-7 yrs)</td>  
          </tr>  
          {/* Add more rows here as needed */}  
        </tbody>  
      </table>  
    </div>  

    {/* FAQs */}  
    <div className="mt-40 max-w-[760px] mx-auto text-left">  
      <h2 className="text-[clamp(26px,6vw,52px)] font-bold text-center mb-16 tracking-[-0.03em]">Frequently Asked Questions</h2>  
      <div className="space-y-0">  
        {faqs.map((faq, i) => (  
          <details key={i} className="group border-b border-[rgba(255,255,255,0.07)]">  
            <summary className="font-bold text-[18px] cursor-pointer list-none flex justify-between items-center text-white py-[22px] group-hover:bg-[rgba(255,255,255,0.02)] transition-colors">  
              {faq.q}  
              <span className="text-[#E8D5B0] text-[24px] group-open:rotate-45 transition-transform duration-200">+</span>  
            </summary>  
            <div className="overflow-hidden bg-[rgba(232,213,176,0.025)] border-l-[3px] border-[#E8D5B0] px-6 py-4 mb-4 rounded-r mt-[-4px]">  
              <p className="text-[15px] text-[#A1A1A6] leading-[1.7]">{faq.a}</p>  
            </div>  
          </details>  
        ))}  
      </div>  
    </div>  
  </div>  
</div>

);
      }
