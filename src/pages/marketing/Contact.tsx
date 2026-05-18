import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/src/components/ui/button';
import { Input } from '../../components/ui/input';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    useCase: 'Developer',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent(`ARKVOID Inquiry: ${formData.useCase} - ${formData.company || formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\nCompany: ${formData.company}\nUse Case: ${formData.useCase}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:hey.cherazen@gmail.com?subject=${subject}&body=${body}`;
  };

  return (
    <>
      <Helmet>
        <title>Contact Us | ARKVOID</title>
        <meta name="description" content="Get in touch with the ARKVOID team for enterprise inquiries, support, and partnership opportunities." />
      </Helmet>

      <div className="pt-32 pb-24 px-4 max-w-6xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 text-white text-center heading-underline">Contact Us</h1>
        <p className="text-ark-text-muted text-center mb-16 text-lg">We respond within 24 hours.</p>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left Column: Info */}
          <div className="space-y-8">
            <div className="glass-card p-8 rounded-2xl border border-ark-border">
              <h3 className="text-xl font-bold text-white mb-6">Direct Email</h3>
              <div className="space-y-4">
                <a href="mailto:hey.cherazen@gmail.com" className="flex items-center gap-4 text-ark-text-secondary hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-full bg-ark-primary/20 flex items-center justify-center text-ark-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  hey.cherazen@gmail.com
                </a>
                <a href="mailto:heyarkvoid@gmail.com" className="flex items-center gap-4 text-ark-text-secondary hover:text-white transition-colors">
                  <div className="w-10 h-10 rounded-full bg-ark-primary/20 flex items-center justify-center text-ark-primary">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  heyarkvoid@gmail.com
                </a>
              </div>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-ark-border">
              <h3 className="text-xl font-bold text-white mb-6">Socials</h3>
              <a href="https://x.com/ArkvoidAI" target="_blank" rel="noreferrer" className="flex items-center gap-4 text-ark-text-secondary hover:text-white transition-colors">
                <div className="w-10 h-10 rounded-full bg-ark-primary/20 flex items-center justify-center text-ark-primary">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                @ArkvoidAI on X
              </a>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-ark-primary/20 to-transparent border border-ark-primary/30">
              <h3 className="text-xl font-bold text-white mb-2">Enterprise Support</h3>
              <p className="text-ark-text-secondary mb-4">Building for a regulated industry? Talk to us about enterprise.</p>
              <a href="mailto:heyarkvoid@gmail.com?subject=Enterprise%20Inquiry" className="inline-flex items-center justify-center px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                Talk to Us
              </a>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="glass-card p-8 rounded-2xl border border-ark-border">
            <h3 className="text-2xl font-bold text-white mb-6">Send a Message</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ark-text-secondary">Name</label>
                  <Input 
                    required 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Jane Doe"
                    className="bg-ark-surface/50 border-ark-border focus:border-ark-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ark-text-secondary">Email</label>
                  <Input 
                    type="email"
                    required 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="jane@company.com"
                    className="bg-ark-surface/50 border-ark-border focus:border-ark-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-ark-text-secondary">Company</label>
                <Input 
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                  placeholder="Acme Corp"
                  className="bg-ark-surface/50 border-ark-border focus:border-ark-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ark-text-secondary">What's your use case?</label>
                <select 
                  value={formData.useCase}
                  onChange={e => setFormData({...formData, useCase: e.target.value})}
                  className="w-full h-10 px-3 py-2 rounded-md bg-ark-surface/50 border border-ark-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-ark-primary focus:border-transparent"
                >
                  <option value="Fintech">Fintech</option>
                  <option value="LegalTech">LegalTech</option>
                  <option value="Enterprise AI">Enterprise AI</option>
                  <option value="Developer">Developer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-ark-text-secondary">Message</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  className="w-full px-3 py-2 rounded-md bg-ark-surface/50 border border-ark-border text-sm text-white focus:outline-none focus:ring-2 focus:ring-ark-primary focus:border-transparent resize-none"
                  placeholder="How can we help you?"
                ></textarea>
              </div>

              <Button type="submit" variant="primary" className="w-full shadow-[0_0_20px_rgba(255,255,255,0.4)] text-black">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
