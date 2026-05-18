import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const sections = [
  { id: 'acceptance', title: '1. Acceptance of Terms' },
  { id: 'description', title: '2. Description of Service' },
  { id: 'account', title: '3. Account Responsibilities' },
  { id: 'data', title: '4. Data and Intellectual Property' },
  { id: 'api', title: '5. API Usage' },
  { id: 'payment', title: '6. Payment Terms' },
  { id: 'confidentiality', title: '7. Confidentiality' },
  { id: 'termination', title: '8. Termination' },
  { id: 'sla', title: '9. SLA' },
  { id: 'warranties', title: '10. Disclaimer of Warranties' },
  { id: 'liability', title: '11. Limitation of Liability' },
  { id: 'indemnification', title: '12. Indemnification' },
  { id: 'governing-law', title: '13. Governing Law' },
  { id: 'changes', title: '14. Changes to Terms' }
];

export function Terms() {
  const [activeSection, setActiveSection] = useState('acceptance');
  const [tocOpen, setTocOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTocOpen(false);
  };

  return (
    <div className="bg-black min-h-screen pt-32 pb-24 text-white font-sans">
      <Helmet>
        <title>Terms of Service | ARKVOID</title>
        <meta name="description" content="ARKVOID Terms of Service" />
      </Helmet>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-12 border-b border-[rgba(255,255,255,0.06)] pb-8">
          <p className="text-[#A1A1A6] text-[14px] uppercase tracking-wider mb-4">Last Updated: May 14, 2026</p>
          <h1 className="text-[36px] font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-[17px] text-[#A1A1A6]">Effective Date: May 14, 2026 | Contact: hey.cherazen@gmail.com</p>
        </div>

        {/* Mobile TOC Toggle */}
        <div className="md:hidden flex flex-col mb-8 border border-[rgba(255,255,255,0.1)] rounded-lg overflow-hidden">
          <button 
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.02)] flex justify-between items-center text-[15px] font-bold"
            onClick={() => setTocOpen(!tocOpen)}
          >
            Table of Contents
            <span className="text-[#E8D5B0] text-[20px]">{tocOpen ? '−' : '+'}</span>
          </button>
          if (tocOpen) {
            <div className="bg-[#0A0A0A] p-4 flex flex-col gap-3 border-t border-[rgba(255,255,255,0.05)]">
              {sections.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => scrollTo(s.id)}
                  className={`text-left text-[14px] ${activeSection === s.id ? 'text-white font-bold' : 'text-[#A1A1A6]'}`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          }
        </div>

        <div className="flex flex-col md:flex-row gap-16 relative">
          {/* Desktop Sticky TOC */}
          <div className="hidden md:block w-[240px] shrink-0">
            <div className="sticky top-32 flex flex-col gap-3 border-l border-[rgba(255,255,255,0.06)] pl-4">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-[#6E6E73] mb-4">Table of Contents</h3>
              {sections.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => scrollTo(s.id)}
                  className={`text-left text-[14px] leading-snug transition-colors relative py-1 ${activeSection === s.id ? 'text-white font-semibold' : 'text-[#A1A1A6] hover:text-[#E8D5B0]'}`}
                >
                  {activeSection === s.id && (
                    <div className="absolute -left-[18px] top-0 bottom-0 w-[2px] bg-[#E8D5B0]" />
                  )}
                  {s.title}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="w-full max-w-[900px] pb-32">
            
            <section id="acceptance" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">1. Acceptance of Terms</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                By accessing or using the services provided by ARKVOID Inc. ("ARKVOID", "we", "our", or "us"), you ("User", "you", or "your") agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section id="description" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">2. Description of Service</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                ARKVOID is an AI governance and audit trail infrastructure platform. We provide software development kits (SDKs), application programming interfaces (APIs), and a web-based dashboard allowing you to capture, securely store, and review cryptographic traces of AI agent decisions and executions.
              </p>
            </section>

            <section id="account" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">3. Account Responsibilities</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and API keys. You agree not to disclose your password to any third party and to notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section id="data" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">4. Data and Intellectual Property</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                You retain all rights, title, and interest in and to all data, including trace data, submitted to the Service by you ("Customer Data"). ARKVOID claims no intellectual property rights over the material you provide to the Service. The Service and its original content, features, and functionality are and will remain the exclusive property of ARKVOID Inc.
              </p>
            </section>

            <section id="api" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">5. API Usage</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Rate limits for accessing ARKVOID APIs vary based on your active subscription plan:
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Developer:</strong> 1,000 API requests/day, 10 requests/second</li>
                <li className="mb-2"><strong>Growth:</strong> 100,000 API requests/day, 100 requests/second</li>
                <li className="mb-2"><strong>Scale:</strong> 1,000,000 API requests/day, 500 requests/second</li>
                <li className="mb-2"><strong>Enterprise:</strong> custom limits per contract</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Exceeding these limits may result in temporary throttling or suspension of API access.
              </p>
            </section>

            <section id="payment" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">6. Payment Terms</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">Our payment terms are strictly enforced:</p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Billing:</strong> Fees are billed in advance on a monthly or annual basis via Stripe.</li>
                <li className="mb-2"><strong>Currency:</strong> USD (EU customers may be billed in EUR at the current exchange rate).</li>
                <li className="mb-2"><strong>Invoice:</strong> Generated automatically and sent by email.</li>
                <li className="mb-2"><strong>Disputes:</strong> Must be raised within 30 days of the charge.</li>
                <li className="mb-2"><strong>Refunds:</strong> 7-day window for monthly plans, 30-day full refund for annual plans (then pro-rated).</li>
                <li className="mb-2"><strong>Taxes:</strong> Customer is responsible for applicable VAT/GST.</li>
                <li className="mb-2"><strong>Late payment:</strong> 30-day cure period before account suspension.</li>
              </ul>
            </section>

            <section id="confidentiality" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">7. Confidentiality</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                During the term of your use of the Service, each party may disclose to the other certain confidential information. Both parties agree to protect each other's confidential information from unauthorized disclosure with the same degree of care they use to protect their own similar information, but no less than reasonable care.
              </p>
            </section>

            <section id="termination" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">8. Termination</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms. You may cancel your account at any time.
              </p>
            </section>

            <section id="sla" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">9. SLA</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Service Level Agreements apply based on your subscription tier:
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Developer:</strong> No SLA</li>
                <li className="mb-2"><strong>Growth:</strong> 99.5% monthly uptime target</li>
                <li className="mb-2"><strong>Scale:</strong> 99.7% monthly uptime target</li>
                <li className="mb-2"><strong>Enterprise:</strong> 99.9% contractual SLA with credit mechanism</li>
              </ul>
            </section>

            <section id="warranties" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
              </p>
            </section>

            <section id="liability" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">11. Limitation of Liability</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                In no event shall ARKVOID, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section id="indemnification" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">12. Indemnification</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                You agree to defend, indemnify and hold harmless ARKVOID and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of your use and access of the Service, or a breach of these Terms.
              </p>
            </section>

            <section id="governing-law" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">13. Governing Law</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                These Terms shall be governed and construed in accordance with the laws of Delaware, United States, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            <section id="changes" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">14. Changes to Terms</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

          </div>
        </div>

        {/* Back to top (Mobile) */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="md:hidden fixed bottom-6 right-6 w-12 h-12 bg-[#2D2D2D] rounded-full flex items-center justify-center border border-[rgba(255,255,255,0.1)] shadow-lg z-50 text-white"
        >
          ↑
        </button>
      </div>
    </div>
  );
}
