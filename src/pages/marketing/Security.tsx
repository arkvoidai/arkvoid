import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const sections = [
  { id: 'philosophy', title: '1. Our Security Philosophy' },
  { id: 'infrastructure', title: '2. Infrastructure Security' },
  { id: 'encryption', title: '3. Data Encryption' },
  { id: 'cryptographic', title: '4. Cryptographic Architecture' },
  { id: 'access', title: '5. Access Controls' },
  { id: 'vulnerability', title: '6. Vulnerability Management' },
  { id: 'incident', title: '7. Incident Response' },
  { id: 'compliance', title: '8. Compliance Certifications (roadmap)' },
  { id: 'contact', title: '9. Security Contact' }
];

export function Security() {
  const [activeSection, setActiveSection] = useState('philosophy');
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
        <title>Security at ARKVOID</title>
        <meta name="description" content="Security practices and architecture at ARKVOID." />
      </Helmet>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-12 border-b border-[rgba(255,255,255,0.06)] pb-8">
          <p className="text-[#A1A1A6] text-[14px] uppercase tracking-wider mb-4">Last Updated: May 14, 2026</p>
          <h1 className="text-[36px] font-bold text-white mb-2">Security at ARKVOID</h1>
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
            
            <section id="philosophy" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">1. Our Security Philosophy</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                At ARKVOID, security is not an afterthought; it is the foundational principle of our product. We are building the infrastructure for verifiable and accountable AI. This means our systems must be structurally resilient against tampering, unauthorized access, and data leakage. We employ defense-in-depth, least-privilege principles, and verifiable cryptographic architectures.
              </p>
            </section>

            <section id="infrastructure" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">2. Infrastructure Security</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Our core infrastructure is hosted on Supabase (running on AWS), which is SOC 2 Type II certified. We utilize robust network isolation, VPC peering where necessary for Enterprise clients, and stringent firewall configurations to protect all inbound and outbound traffic. Services are decoupled to minimize blast radiuses in the event of an anomaly.
              </p>
            </section>

            <section id="encryption" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">3. Data Encryption</h2>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Encryption at rest:</strong> All data stored within ARKVOID databases, including hashes and trace metadata, is encrypted at rest using AES-256.</li>
                <li className="mb-2"><strong>Encryption in transit:</strong> All data transmitted between clients and our APIs, and internally between our microservices, is strictly enforced to use TLS 1.3 or higher.</li>
              </ul>
            </section>

            <section id="cryptographic" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">4. Cryptographic Architecture</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Our tamper-evident ledger is built on verifiable cryptography:
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Payload Hashing:</strong> We enforce SHA-256 hashing on all payload content by default.</li>
                <li className="mb-2"><strong>Digital Signatures:</strong> Ed25519 signing is applied on all trace records to ensure identity authenticity.</li>
                <li className="mb-2"><strong>Zero-knowledge option:</strong> For Enterprise customers, we offer a zero-knowledge architecture where we only ingest hashes calculated client-side; we never see the raw prompt or response content.</li>
              </ul>
            </section>

            <section id="access" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">5. Access Controls</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Access to our production environments is restricted via strict Role-Based Access Control (RBAC). Only essential engineering personnel have access, guarded by mandatory Multi-Factor Authentication (MFA), IP whitelisting, and signed NDAs. All internal access is logged and audited.
              </p>
            </section>

            <section id="vulnerability" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">6. Vulnerability Management</h2>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">Annual third-party penetration testing.</li>
                <li className="mb-2">HackerOne responsible disclosure program (launching soon).</li>
                <li className="mb-2">Bug bounty: email security@arkvoid.com or hey.cherazen@gmail.com.</li>
                <li className="mb-2">Continuous static and dynamic code analysis during our CI/CD pipelines.</li>
              </ul>
            </section>

            <section id="incident" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">7. Incident Response</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We maintain a comprehensive Incident Response Plan. Our Security incident response SLA guarantees a 24h acknowledgement and a 72h initial assessment timeframe for any reported or detected severe anomalies.
              </p>
            </section>

            <section id="compliance" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">8. Compliance Certifications (roadmap)</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We are actively undergoing compliance audits.
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">SOC 2 Type II in progress (target: Q4 2026)</li>
                <li className="mb-2">GDPR and CCPA compliant data handling</li>
                <li className="mb-2">Aligned with EU AI Act documentation guidelines</li>
              </ul>
            </section>

            <section id="contact" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">9. Security Contact</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                Security contact: hey.cherazen@gmail.com<br/>
                PGP key: [Generated on request]
              </p>
              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">Responsible disclosure policy:</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                "If you discover a security vulnerability, please disclose it responsibly by emailing hey.cherazen@gmail.com. We will acknowledge within 24 hours and work to resolve confirmed vulnerabilities within 30 days. We do not pursue legal action against good-faith researchers."
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
