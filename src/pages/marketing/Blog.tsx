import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

const articles = [
  {
    slug: 'ai-agent-accountability-infrastructure-problem',
    title: 'Why AI Agent Accountability Is the Next Infrastructure Problem',
    date: 'May 2026',
    tag: 'Infrastructure',
    readingTime: '8 min',
    excerpt: 'As AI agents move from demos to production — approving transactions, generating contracts, processing sensitive data — the absence of a chain of custody becomes a category risk for every company deploying them...'
  },
  {
    slug: 'eu-ai-act-article-13-transparency',
    title: 'The EU AI Act Article 13: What Transparency Actually Means for Your AI Stack',
    date: 'April 2026',
    tag: 'Compliance',
    readingTime: '6 min',
    excerpt: 'Article 13 of the EU AI Act requires operators of high-risk AI systems to ensure those systems are transparent — specifically that humans can understand why an AI made a decision. Here\'s what that means technically...'
  },
  {
    slug: 'from-debug-to-audit-cryptographic-traces',
    title: 'From Debug to Audit: How Cryptographic Traces Change AI Operations',
    date: 'March 2026',
    tag: 'Engineering',
    readingTime: '10 min',
    excerpt: 'The moment your AI agent starts taking actions in the world — not just generating text — your operational model needs to change. You\'re no longer just running inference. You\'re running infrastructure...'
  }
];

export function Blog() {
  return (
    <div className="bg-black min-h-screen pt-32 pb-24 text-white font-sans">
      <Helmet>
        <title>Blog | ARKVOID</title>
        <meta name="description" content="Insights and engineering principles on AI governance and infrastructure." />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "Blog",
              "name": "ARKVOID Blog",
              "url": "https://arkvoid.com/blog"
            }
          `}
        </script>
      </Helmet>

      <div className="max-w-[800px] mx-auto px-6">
        <div className="mb-16">
          <h1 className="text-[clamp(34px,9vw,64px)] font-bold text-white mb-6 tracking-[-0.03em]">Blog</h1>
          <p className="text-[17px] text-[#A1A1A6] max-w-[600px] leading-[1.6]">
            Deep dives into verifiable AI infrastructure, compliance operations, and agentic governance.
          </p>
        </div>

        <div className="flex flex-col gap-8">
          {articles.map((article, i) => (
            <Link 
              key={i} 
              to={`/blog/${article.slug}`}
              className="group block bg-[#0A0A0A] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 hover:-translate-y-1 hover:border-[#E8D5B0]/30 hover:shadow-[0_0_40px_rgba(232,213,176,0.05)] transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-4 text-[13px] text-[#6E6E73] font-mono uppercase tracking-wider">
                <span className="bg-[rgba(232,213,176,0.1)] text-[#E8D5B0] px-3 py-1 rounded-[980px] font-sans normal-case tracking-normal text-[12px] font-semibold">{article.tag}</span>
                <span>{article.date}</span>
                <span>&middot;</span>
                <span>{article.readingTime} read</span>
              </div>
              <h2 className="text-[20px] font-bold text-white mb-4 leading-tight group-hover:text-[#E8D5B0] transition-colors">{article.title}</h2>
              <p className="text-[14px] text-[#A1A1A6] leading-[1.6] mb-6">{article.excerpt}</p>
              <div className="text-[14px] font-semibold text-[#E8D5B0] flex items-center gap-2">
                Read article <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
