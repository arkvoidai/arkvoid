import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../shared/logo';
import { Twitter, Github, Linkedin } from 'lucide-react';
import { COMPANY } from '@/src/lib/constants';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-ark-bg border-t border-ark-border pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <div className="inline-block mb-6">
              <Logo />
            </div>
            <p className="text-ark-text-secondary text-sm mb-6 max-w-xs">
              The Chain of Custody for AI Decisions. Cryptographic provenance for enterprise AI agents.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://twitter.com/ArkvoidAI" target="_blank" rel="noreferrer" className="text-ark-text-secondary hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="text-ark-text-secondary hover:text-white transition-colors">
                <span className="sr-only">GitHub</span>
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-ark-text-secondary hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-3">
              <li><Link to="/dashboard/agents" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Agent Registry</Link></li>
              <li><Link to="/dashboard/traces" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Cryptographic Traces</Link></li>
              <li><Link to="/dashboard/compliance" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Compliance Reports</Link></li>
              <li><Link to="/pricing" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">About Us</Link></li>
              <li><Link to="/blog" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Blog</Link></li>
              <li><Link to="/careers" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Careers</Link></li>
              <li><a href="mailto:heyarkvoid@gmail.com" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              <li><Link to="/privacy" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/security" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">Security & Trust</Link></li>
              <li><Link to="/dpa" className="text-sm text-ark-text-secondary hover:text-ark-primary transition-colors">DPA</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-ark-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-ark-text-muted">
            &copy; {currentYear} {COMPANY}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-ark-text-muted">
            <Link to="/status" className="flex items-center gap-2 hover:text-white transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-ark-success opacity-80 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
              Systems Operational
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff7b00] opacity-80 shadow-[0_0_8px_rgba(255,123,0,0.5)]"></div>
              AI Governance Active
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
