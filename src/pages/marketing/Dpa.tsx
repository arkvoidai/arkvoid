import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const sections = [
  { id: 'definitions', title: '1. Definitions' },
  { id: 'scope', title: '2. Scope and Purpose of Processing' },
  { id: 'roles', title: '3. Data Controller and Processor Roles' },
  { id: 'instructions', title: '4. Instructions for Processing' },
  { id: 'subprocessors', title: '5. Sub-processors' },
  { id: 'rights', title: '6. Data Subject Rights Assistance' },
  { id: 'security', title: '7. Security Measures' },
  { id: 'breach', title: '8. Data Breach Notification' },
  { id: 'retention', title: '9. Data Retention and Deletion' },
  { id: 'transfers', title: '10. International Transfers' },
  { id: 'audit', title: '11. Audit Rights' },
  { id: 'termination', title: '12. Term and Termination' }
];

export function Dpa() {
  const [activeSection, setActiveSection] = useState('definitions');
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
        <title>Data Processing Addendum (DPA) | ARKVOID</title>
        <meta name="description" content="ARKVOID Data Processing Addendum for GDPR, UK GDPR, and CCPA compliance." />
      </Helmet>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-12 border-b border-[rgba(255,255,255,0.06)] pb-8">
          <p className="text-[#A1A1A6] text-[14px] uppercase tracking-wider mb-4">Last Updated: May 14, 2026</p>
          <h1 className="text-[36px] font-bold text-white mb-2">Data Processing Addendum (DPA)</h1>
          <p className="text-[17px] text-[#A1A1A6]">For customers subject to GDPR, UK GDPR, or CCPA</p>
          <div className="mt-6 p-4 bg-[rgba(232,213,176,0.05)] border border-[rgba(232,213,176,0.2)] rounded-lg text-[14px] text-[#A1A1A6] leading-[1.6]">
            <strong>Note:</strong> Customers requiring a signed DPA for enterprise procurement should contact 
            <a href="mailto:heyarkvoid@gmail.com" className="text-[#E8D5B0] hover:underline ml-1">heyarkvoid@gmail.com</a>. 
            We can execute DPAs for Growth and above plans.
          </div>
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
          {tocOpen && (
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
          )}
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
            
            <section id="definitions" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">1. Definitions</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Capitalized terms used in this DPA shall have the meanings given to them in the Terms of Service. Additional definitions include: "Data Protection Laws", "Personal Data", "Controller", "Processor", "Data Subject", and "Sub-processor" which align with their definitions under the GDPR.
              </p>
            </section>

            <section id="scope" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">2. Scope and Purpose of Processing</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                This DPA applies when Personal Data is processed by ARKVOID (the Processor) on behalf of the Customer (the Controller) as part of the Services. The purpose is strictly to provide the AI governance, trace logging, and auditing infrastructure functionality described in our Terms of Service.
              </p>
            </section>

            <section id="roles" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">3. Data Controller and Processor Roles</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                The Customer acts as the Data Controller (or an intermediary Data Processor on behalf of its own clients) who determines the purposes and context of data processed. ARKVOID acts as the Data Processor.
              </p>
            </section>

            <section id="instructions" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">4. Instructions for Processing</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                ARKVOID will process Personal Data only in accordance with the Customer's documented instructions (which are dictated by their usage of the API and configuration of the Service) unless legally required to do otherwise.
              </p>
            </section>

            <section id="subprocessors" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">5. Sub-processors</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Customer generally authorizes ARKVOID to engage Sub-processors. The current list of Sub-processors is outlined in Section 7 of our Privacy Policy. ARKVOID remains fully liable for the acts and omissions of its Sub-processors.
              </p>
            </section>

            <section id="rights" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">6. Data Subject Rights Assistance</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                ARKVOID shall, taking into account the nature of the processing, assist Customer by appropriate technical and organizational measures to fulfill Customer's obligation to respond to requests exercising Data Subject rights under Data Protection Laws.
              </p>
            </section>

            <section id="security" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">7. Security Measures</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                ARKVOID shall implement and maintain appropriate technical and organizational security measures to protect Personal Data against unauthorized access, loss, or alteration. These measures are detailed on our Security page.
              </p>
            </section>

            <section id="breach" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">8. Data Breach Notification</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                ARKVOID will notify the Customer without undue delay (and in any event within 72 hours) upon becoming aware of a Personal Data Breach affecting Customer Data, to assist the Customer in meeting their own GDPR notification requirements.
              </p>
            </section>

            <section id="retention" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">9. Data Retention and Deletion</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Following termination of the Services, or upon Customer request, ARKVOID will return or delete all Personal Data processed on behalf of the Customer, subject to limitations where applicable laws require retention.
              </p>
            </section>

            <section id="transfers" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">10. International Transfers</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Any transfer of EU Personal Data to third countries will be subject to appropriate safeguards, typically under EU Standard Contractual Clauses (SCCs), which are deemed incorporated into this DPA.
              </p>
            </section>

            <section id="audit" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">11. Audit Rights</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Upon reasonable request, ARKVOID will make available to the Customer information necessary to demonstrate compliance with this DPA. Enterprise-tier customers may request formal SOC 2 reports and potentially conduct reasonable audits under a separate confidentiality agreement.
              </p>
            </section>

            <section id="termination" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">12. Term and Termination</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                This DPA shall remain in effect until the overarching Terms of Service are terminated and all Customer Personal Data is deleted.
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
