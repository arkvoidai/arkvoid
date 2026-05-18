import React from 'react';
import { Helmet } from 'react-helmet-async';

export function About() {
  return (
    <>
      <Helmet>
        <title>About ARKVOID | AI Governance Infrastructure</title>
        <meta name="description" content="AI should be as accountable as the humans it replaces. Learn about ARKVOID's mission to bring cryptographic accountability to AI agents." />
      </Helmet>

      <div className="pt-32 pb-24 px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-16 text-center tracking-tight text-white heading-underline">
          About ARKVOID
        </h1>

        <div className="prose prose-invert prose-lg max-w-none text-ark-text-secondary">
          <p className="text-xl leading-relaxed text-white mb-8">
            ARKVOID was started by Manish Talukdar.
          </p>
          <p className="leading-relaxed mb-8">
            The problem was simple and terrifying: as AI agents took on real decision-making — executing transactions, modifying infrastructure, processing sensitive data — there was no way to answer basic accountability questions about what they did.
          </p>
          <p className="leading-relaxed mb-16">
            ARKVOID exists to give every AI action a permanent, cryptographic record. Not for compliance checkbox purposes. Because AI acting in the world without accountability is dangerous and we can fix it.
          </p>
        </div>

        <div className="my-24 p-12 glass-card border border-ark-primary/30 rounded-2xl relative overflow-hidden align-center text-center">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-ark-primary to-transparent opacity-50"></div>
            <h2 className="text-3xl md:text-5xl font-bold text-white text-glow mb-4">
              "AI should be as accountable as the humans it replaces."
            </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 mb-16">
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 heading-underline">The Team</h3>
            <div className="glass-card p-6 border border-ark-border rounded-xl">
              <h4 className="text-xl font-semibold text-white mb-1">Manish Talukdar</h4>
              <p className="text-ark-primary mb-4 text-sm font-medium">Founder & Developer</p>
              <a href="https://x.com/zenithmanish" target="_blank" rel="noreferrer" className="text-ark-text-muted hover:text-white transition-colors text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                @zenithmanish on X
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 heading-underline">Contact</h3>
            <div className="glass-card p-6 border border-ark-border rounded-xl space-y-4">
              <a href="mailto:hey.cherazen@gmail.com" className="block text-ark-text-secondary hover:text-ark-primary transition-colors">
                hey.cherazen@gmail.com
              </a>
              <a href="mailto:heyarkvoid@gmail.com" className="block text-ark-text-secondary hover:text-ark-primary transition-colors">
                heyarkvoid@gmail.com
              </a>
              <a href="https://x.com/ArkvoidAI" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-ark-text-secondary hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                @ArkvoidAI on X
              </a>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
