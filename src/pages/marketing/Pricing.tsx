import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const pricingPlans = [
  {
    name: 'FREE',
    price: '$0',
    frequency: 'forever',
    annualPrice: '$0',
    tagline: 'For developers exploring AI infrastructure',
    features: [
      { text: '3 agent identities', included: true },
      { text: '25K traces / month', included: true },
      { text: '7-day retention', included: true },
      { text: 'Trace explorer', included: true },
      { text: 'REST API access', included: true },
      { text: 'Community support', included: true },
    ],
    cta: 'Start Free',
    ctaStyle: 'ghost',
    note: 'No credit card required',
    planKey: 'FREE',
  },
  {
    name: 'PRO',
    price: '$24',
    frequency: 'mo',
    annualPrice: '$19',
    annualBillingText: 'billed $228/yr',
    tagline: 'For teams running AI agents in production',
    mostPopular: true,
    features: [
      { text: '20 agent identities', included: true },
      { text: '500K traces / month', included: true },
      { text: '90-day retention', included: true },
      { text: 'Advanced trace search', included: true },
      { text: 'AI observability analytics', included: true },
      { text: 'Compliance snapshots', included: true },
      { text: 'PDF & CSV export', included: true },
      { text: 'Email alerts', included: true },
    ],
    cta: 'Start Free Trial',
    ctaStyle: 'filled',
    note: '14-day free trial',
    planKey: 'PRO',
  },
  {
    name: 'TEAM',
    price: '$99',
    frequency: 'mo',
    annualPrice: '$79',
    annualBillingText: 'billed $948/yr',
    tagline: 'For high-scale AI systems and operations',
    features: [
      { text: 'Unlimited identities', included: true },
      { text: '5M traces / month', included: true },
      { text: '1-year retention', included: true },
      { text: 'RBAC permissions', included: true },
      { text: 'Multi-environment workspaces', included: true },
      { text: 'Custom governance policies', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority Slack support', included: true },
    ],
    cta: 'Upgrade to Team',
    ctaStyle: 'ghost',
    note: '',
    planKey: 'TEAM',
  },
  {
    name: 'ENTERPRISE',
    price: 'Custom',
    frequency: '',
    tagline: 'For organizations building mission-critical AI',
    features: [
      { text: 'Custom trace volume & retention', included: true },
      { text: 'Audit export & SIEM integration', included: true },
      { text: 'EU AI Act compliance tooling', included: true },
      { text: 'SSO / SAML', included: true },
      { text: 'On-premise / VPC deployment', included: true },
      { text: 'Custom SLA & support', included: true },
      { text: 'Dedicated success manager', included: true },
    ],
    cta: 'Talk to Sales',
    ctaStyle: 'ghost',
    link: 'mailto:heyarkvoid@gmail.com',
    note: '',
    planKey: 'ENTERPRISE',
  },
];

const faqs = [
  {
    q: 'How is a "trace" counted?',
    a: 'One trace = one complete agent action execution, from input through all tool calls to final output.',
  },
  {
    q: 'Can I switch plans anytime?',
    a: 'Yes. Upgrades take effect immediately. Downgrades take effect at your next billing cycle.',
  },
  {
    q: 'Do unused traces roll over?',
    a: 'No. Monthly traces reset on your billing date.',
  },
  {
    q: 'How does the free trial work?',
    a: 'You get full Pro-plan access for 14 days. No credit card required.',
  },
  {
    q: 'Is ARKVOID available globally?',
    a: 'Yes. We support customers globally. Payments are processed in INR via Razorpay for Indian customers.',
  },
  {
    q: 'Does on-premise deployment affect pricing?',
    a: 'Yes. On-premise deployment is Enterprise only.',
  },
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
        <title>Pricing | ARKVOID</title>
        <meta name="description" content="Infrastructure for trusted AI systems." />
      </Helmet>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-[clamp(34px,9vw,76px)] font-bold tracking-[-0.03em] mb-8">
            Infrastructure for trusted AI systems.
          </h1>

          <div className="inline-flex items-center gap-1 p-1 bg-[rgba(255,255,255,0.06)] rounded-[980px]">
            <button
              className={`px-5 py-2 text-[13px] rounded-[980px] transition-colors ${
                !isAnnual ? 'bg-white text-black font-[600]' : 'text-[#6E6E73] font-normal'
              }`}
              onClick={() => setIsAnnual(false)}
            >
              Monthly
            </button>
            <button
              className={`px-5 py-2 text-[13px] rounded-[980px] transition-colors flex items-center gap-2 ${
                isAnnual ? 'bg-white text-black font-[600]' : 'text-[#6E6E73] font-normal'
              }`}
              onClick={() => setIsAnnual(true)}
            >
              Annual
              <span className="text-[11px] bg-[rgba(52,211,153,0.15)] text-[#34D399] px-[8px] py-[3px] rounded-[980px]">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div
          className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-4 gap-6 pb-8 hide-scrollbar"
          onScroll={handleScroll}
          ref={containerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {pricingPlans.map((plan) => (
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
              <p className="text-[14px] text-[#A1A1A6] mb-6 min-h-[48px]">{plan.tagline}</p>

              <div className="mb-8">
                {plan.price === 'Custom' ? (
                  <div className="text-[48px] font-bold text-white tracking-[-0.04em]">Custom</div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-[48px] font-bold text-white tracking-[-0.04em]">
                      {currentPrice(plan)}
                    </span>
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
                      ? 'bg-[#F59E0B] text-black hover:scale-[1.02]'
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
                      ? 'bg-[#F59E0B] text-black hover:scale-[1.02]'
                      : 'bg-transparent border border-white text-white hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}

              <div className="text-[11px] text-[#6E6E73] text-center mb-8 h-[16px]">{plan.note}</div>

              <ul className="space-y-3 mt-auto">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className={`flex items-start gap-3 text-[14px] ${
                      feature.included ? 'text-white' : 'text-[#3D3D3D]'
                    }`}
                  >
                    <Check className="w-4 h-4 text-[#34D399] shrink-0 mt-[2px]" />
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Mobile scroll indicator */}
        <div className="flex justify-center gap-2 mt-2 md:hidden">
          {pricingPlans.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                activeCard === i ? 'w-6 bg-white' : 'w-1.5 bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* FAQs */}
        <div className="mt-24 max-w-[720px] mx-auto">
          <h2 className="text-[28px] font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none text-[15px] font-medium text-white">
                  {faq.q}
                  <span className="ml-4 text-[#6E6E73] group-open:rotate-180 transition-transform shrink-0">↓</span>
                </summary>
                <div className="px-6 pb-5 text-[14px] text-[#A1A1A6] leading-relaxed">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
