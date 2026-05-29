import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const sections = [
  { id: 'introduction', title: '1. Introduction' },
  { id: 'information', title: '2. Information We Collect' },
  { id: 'processing', title: '3. How We Process Your Information' },
  { id: 'legal-bases', title: '4. Legal Bases for Processing (GDPR)' },
  { id: 'security', title: '5. Data Storage, Security & Infrastructure' },
  { id: 'retention', title: '6. Data Retention' },
  { id: 'subprocessors', title: '7. Third-Party Services & Sub-processors' },
  { id: 'international', title: '8. International Data Transfers' },
  { id: 'rights', title: '9. Your Privacy Rights' },
  { id: 'cookies', title: '10. Cookies and Tracking Technologies' },
  { id: 'children', title: '11. Children\'s Privacy' },
  { id: 'changes', title: '12. Changes to This Policy' },
  { id: 'contact', title: '13. Contact Information' }
];

export function Privacy() {
  const [activeSection, setActiveSection] = useState('introduction');
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
        <title>Privacy Policy | ARKVOID</title>
        <meta name="description" content="ARKVOID Privacy Policy" />
      </Helmet>

      <div className="max-w-[1200px] mx-auto px-6">
        <div className="mb-12 border-b border-[rgba(255,255,255,0.06)] pb-8">
          <p className="text-[#A1A1A6] text-[14px] uppercase tracking-wider mb-4">Last Updated: May 14, 2026</p>
          <h1 className="text-[36px] font-bold text-white mb-2">Privacy Policy</h1>
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
            
            <section id="introduction" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">1. Introduction</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                ARKVOID Inc. ("ARKVOID", "we", "our", "us") is a Delaware corporation operating an AI governance and audit trail infrastructure platform. This Privacy Policy explains how we collect, use, disclose, and protect personal information when you use our services at arkvoid.cherazen.com and any related APIs, SDKs, or products.
              </p>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">This policy complies with:</p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">General Data Protection Regulation (GDPR) — EU/EEA users</li>
                <li className="mb-2">UK GDPR — United Kingdom users</li>
                <li className="mb-2">California Consumer Privacy Act (CCPA) — California residents</li>
                <li className="mb-2">India's Digital Personal Data Protection Act (DPDPA) 2023</li>
              </ul>
            </section>

            <section id="information" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">2.1 Account Information</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                When you create an account, we collect: full name, email address, company name (optional), billing information (processed by Stripe — we never store raw card data), OAuth tokens from Google or GitHub if you use social sign-in.
              </p>

              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">2.2 Usage Data</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We automatically collect: IP address (truncated after 24 hours), browser type and version, operating system, pages viewed, feature interactions, error logs, session duration, API request metadata (endpoint, method, status — not payload content).
              </p>

              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">2.3 Agent Trace Data</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                When you integrate the ARKVOID SDK, we receive and store: cryptographic hashes of prompts and outputs (not raw content by default), model identifiers and version strings, tool call metadata, risk scores, timestamps, agent identifiers, and approval chain records. <strong>Raw prompt and output content is ONLY stored if you explicitly enable "Full Content Capture" in your settings. This is off by default.</strong>
              </p>

              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">2.4 Communications</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                If you contact us by email or via contact forms, we retain those communications to resolve your inquiry and improve our services.
              </p>

              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">2.5 Cookies</h3>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We use only essential session cookies required for authentication. See Section 10 for full details.
              </p>
            </section>

            <section id="processing" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">3. How We Process Your Information</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">We process your information for the following purposes:</p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>(a) Service Delivery:</strong> Providing, maintaining, and improving the ARKVOID platform and all its features.</li>
                <li className="mb-2"><strong>(b) Security and Fraud Prevention:</strong> Detecting, preventing, and investigating security incidents, abuse, and violations of our Terms of Service.</li>
                <li className="mb-2"><strong>(c) Compliance Operations:</strong> Generating compliance reports as requested, maintaining audit trails, supporting your regulatory obligations.</li>
                <li className="mb-2"><strong>(d) Product Improvement:</strong> Analyzing aggregate usage patterns (never individual trace content) to improve features.</li>
                <li className="mb-2"><strong>(e) Communications:</strong> Sending service notices, security alerts, billing notifications, and (where opted in) product updates.</li>
                <li className="mb-2"><strong>(f) Legal Compliance:</strong> Complying with applicable laws, court orders, or regulatory requirements.</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We do NOT: sell your personal data, use your agent trace data to train AI models, share your data with advertisers, or process data for purposes incompatible with those listed above.
              </p>
            </section>

            <section id="legal-bases" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">4. Legal Bases for Processing (GDPR)</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">For users in the EU/EEA:</p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Contract:</strong> processing necessary to deliver the service you signed up for</li>
                <li className="mb-2"><strong>Legitimate Interest:</strong> security monitoring, fraud prevention, service improvement (balanced against your rights)</li>
                <li className="mb-2"><strong>Legal Obligation:</strong> compliance with EU regulations including AI Act</li>
                <li className="mb-2"><strong>Consent:</strong> marketing communications, full content capture (explicit opt-in only)</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">You may withdraw consent at any time without affecting prior processing.</p>
            </section>

            <section id="security" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">5. Data Storage, Security & Infrastructure</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We use Supabase (hosted on AWS) for data storage and authentication.
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Data at rest:</strong> AES-256 encryption</li>
                <li className="mb-2"><strong>Data in transit:</strong> TLS 1.3 minimum, enforced on all connections</li>
                <li className="mb-2"><strong>Cryptographic sealing:</strong> all trace records are signed with Ed25519 keys</li>
                <li className="mb-2"><strong>Access controls:</strong> role-based access, principle of least privilege</li>
                <li className="mb-2"><strong>Employee access:</strong> limited to authorized personnel with signed NDAs</li>
                <li className="mb-2"><strong>Security reviews:</strong> quarterly internal security reviews</li>
                <li className="mb-2"><strong>Penetration testing:</strong> annual third-party penetration tests</li>
                <li className="mb-2"><strong>SOC 2 Type II:</strong> audit in progress, expected completion Q4 2026</li>
              </ul>
              
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">Primary data centers:</p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">US customers: AWS us-east-1 (Virginia) or us-west-2 (Oregon)</li>
                <li className="mb-2">EU customers: AWS eu-west-1 (Ireland) or eu-central-1 (Frankfurt)</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">Enterprise customers may specify data residency region.</p>

            </section>

            <section id="retention" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">6. Data Retention</h2>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Agent trace data:</strong> retained per your plan (7 days / 90 days / custom)</li>
                <li className="mb-2"><strong>Account information:</strong> retained for duration of account + 90 days after deletion</li>
                <li className="mb-2"><strong>Billing records:</strong> 7 years (legal tax compliance requirement)</li>
                <li className="mb-2"><strong>Security logs:</strong> 12 months</li>
                <li className="mb-2"><strong>Marketing communications:</strong> until unsubscribed</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                You may request deletion of your account and associated data at any time. Deletion of trace data is permanent and irreversible. Some data may be retained longer where required by law.
              </p>
            </section>

            <section id="subprocessors" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">7. Third-Party Services & Sub-processors</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">Full list of sub-processors:</p>
              <div className="overflow-x-auto mb-6 border border-[rgba(255,255,255,0.06)] rounded-lg">
                <table className="w-full text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)]">
                      <th className="py-3 px-4 font-semibold text-[14px] text-white">Sub-processor</th>
                      <th className="py-3 px-4 font-semibold text-[14px] text-white">Purpose</th>
                      <th className="py-3 px-4 font-semibold text-[14px] text-white">Data Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[rgba(255,255,255,0.05)]">
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Supabase Inc.</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Database, authentication, storage</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">US / EU</td>
                    </tr>
                    <tr className="border-b border-[rgba(255,255,255,0.05)]">
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Stripe Inc.</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Payment processing</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">US</td>
                    </tr>
                    <tr className="border-b border-[rgba(255,255,255,0.05)]">
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Vercel Inc.</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Application hosting, CDN</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">US / EU</td>
                    </tr>
                    <tr className="border-b border-[rgba(255,255,255,0.05)]">
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Mistral AI SAS</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">AI inference (Arkvoid Intelligence)</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">EU</td>
                    </tr>
                    <tr className="border-b border-[rgba(255,255,255,0.05)]">
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Resend Inc.</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">Transactional email</td>
                      <td className="py-3 px-4 text-[14px] text-[#A1A1A6]">US</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                <strong>Mistral AI note:</strong> We use Mistral AI for the Arkvoid Intelligence anomaly detection engine. Your trace data processed through this feature is NOT used to train Mistral's models. See Mistral's DPA for details.
              </p>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We require all sub-processors to maintain at minimum the same level of data protection as required by this policy.
              </p>
            </section>

            <section id="international" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">8. International Data Transfers</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                For transfers of EU personal data to countries without adequacy decisions (including the United States), we rely on: 
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">EU Standard Contractual Clauses (SCCs) with all US sub-processors</li>
                <li className="mb-2">Binding Corporate Rules where applicable</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">UK users: We rely on equivalent UK transfer mechanisms post-Brexit.</p>
            </section>

            <section id="rights" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">9. Your Privacy Rights</h2>
              
              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">EU/EEA users (GDPR):</h3>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Right of Access:</strong> request a copy of all personal data we hold about you</li>
                <li className="mb-2"><strong>Right of Rectification:</strong> correct inaccurate or incomplete data</li>
                <li className="mb-2"><strong>Right of Erasure:</strong> delete your data ("right to be forgotten")</li>
                <li className="mb-2"><strong>Right of Portability:</strong> receive your data in machine-readable format</li>
                <li className="mb-2"><strong>Right to Object:</strong> object to processing based on legitimate interests</li>
                <li className="mb-2"><strong>Right to Restriction:</strong> restrict processing in certain circumstances</li>
                <li className="mb-2"><strong>Right not to be subject to automated decision-making:</strong> ARKVOID does not make automated decisions with legal effect about you</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">UK users: Same rights as EU under UK GDPR.</p>

              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">California users (CCPA):</h3>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2"><strong>Right to Know:</strong> what personal information we collect and how we use it</li>
                <li className="mb-2"><strong>Right to Delete:</strong> request deletion of your personal information</li>
                <li className="mb-2"><strong>Right to Opt-Out of Sale:</strong> we do not sell personal information</li>
                <li className="mb-2"><strong>Right to Non-Discrimination:</strong> exercising rights will not affect service</li>
              </ul>

              <h3 className="text-[17px] font-bold text-white mt-8 mb-3">India users (DPDPA):</h3>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">Right to information about processing</li>
                <li className="mb-2">Right to correction and erasure</li>
                <li className="mb-2">Right of grievance redressal</li>
              </ul>

              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                To exercise any right: email hey.cherazen@gmail.com with subject "Privacy Rights Request". We respond within 30 days. We may need to verify your identity before processing requests.
              </p>
            </section>

            <section id="cookies" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">10. Cookies and Tracking Technologies</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We use cookies ONLY for essential functions:
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">Session authentication cookies (required to log in)</li>
                <li className="mb-2">CSRF protection tokens (security requirement)</li>
                <li className="mb-2">User preferences (dark/light mode, if applicable)</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">We do NOT use:</p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">Advertising or retargeting cookies</li>
                <li className="mb-2">Third-party analytics cookies (we use privacy-first analytics)</li>
                <li className="mb-2">Social media tracking pixels</li>
                <li className="mb-2">Cross-site tracking of any kind</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">Our website does not respond to Do-Not-Track signals (as there is no universal standard) but we do not track users across websites.</p>
            </section>

            <section id="children" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">11. Children's Privacy</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                ARKVOID is not directed at persons under 16 years of age. We do not knowingly collect personal information from children. If we discover we have collected data from a child under 16 without verifiable parental consent, we will delete it immediately. If you believe we may have collected data from a child, contact us immediately.
              </p>
            </section>

            <section id="changes" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">12. Changes to This Policy</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                We will notify you of material changes by:
              </p>
              <ul className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4 list-disc pl-5">
                <li className="mb-2">Email to the address associated with your account (at least 14 days before change)</li>
                <li className="mb-2">In-app notification banner</li>
                <li className="mb-2">Updated "Last Updated" date at top of this document</li>
              </ul>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">Continued use of ARKVOID after the effective date constitutes acceptance of the updated policy.</p>
            </section>

            <section id="contact" className="mb-16">
              <h2 className="text-[22px] font-bold text-white mt-12 mb-4">13. Contact Information</h2>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                <strong>Data Controller:</strong><br />
                ARKVOID Inc.<br />
                Email: hey.cherazen@gmail.com<br />
                Founder: Manish Talukdar
              </p>
              <p className="text-[15px] text-[#A1A1A6] leading-[1.75] mb-4">
                For EU/EEA users: you have the right to lodge a complaint with your national data protection authority. A list of EU DPAs is available at edpb.europa.eu.
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
