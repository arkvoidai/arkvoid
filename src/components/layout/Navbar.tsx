import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../shared/logo';
import { cn } from '@/src/lib/utils';
import { Github, ArrowRight } from 'lucide-react';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "How it Works", href: "/how-it-works" },
    { name: "Pricing", href: "/#pricing" },
    { name: "Docs", href: "/docs" },
    { name: "Blog", href: "/blog" },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, linkName: string, href: string) => {
    setMobileMenuOpen(false);
    if (linkName === 'Pricing') {
      if (window.location.pathname === '/' || window.location.pathname === '') {
        e.preventDefault();
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled 
            ? "bg-[rgba(0,0,0,0.8)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.05)] py-4" 
            : "bg-transparent border-transparent py-6"
        )}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <div className="flex-shrink-0 relative z-[60]">
            <Logo />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.href} 
                onClick={(e) => {
                  if (link.name === 'Pricing') {
                    if (window.location.pathname === '/' || window.location.pathname === '') {
                      e.preventDefault();
                      document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }
                }}
                className="text-[14px] font-medium text-[#A1A1A6] hover:text-white transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth/login" className="text-[14px] font-medium text-white hover:text-white/80 transition-colors">
              Sign In
            </Link>
            <Link 
              to="/auth/signup" 
              className={cn(
                "px-5 py-2.5 bg-white text-black text-[14px] font-semibold rounded-[980px] hover:scale-[1.02] transition-all",
                scrolled && "shadow-[0_0_20px_rgba(232,213,176,0.15)]"
              )}
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Menu Toggle - EXACTLY 3 lines, 24px, 1.5px stroke, 6px gap */}
          <button
            className="md:hidden relative z-[60] w-[24px] h-[24px] flex flex-col justify-center gap-[6px] focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <div className={cn(
              "w-full h-[1.5px] bg-white transition-all transform origin-center",
              mobileMenuOpen ? "translate-y-[7.5px] rotate-45" : ""
            )} style={{ transitionDuration: '0.25s', transitionTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)' }} />
            <div className={cn(
              "w-full h-[1.5px] bg-white transition-all",
              mobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
            )} style={{ transitionDuration: '0.25s' }} />
            <div className={cn(
              "w-full h-[1.5px] bg-white transition-all transform origin-center",
              mobileMenuOpen ? "-translate-y-[7.5px] -rotate-45" : ""
            )} style={{ transitionDuration: '0.25s', transitionTimingFunction: 'cubic-bezier(0.25,0.46,0.45,0.94)' }} />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-[40] bg-[#0A0A0A] transition-transform duration-500 ease-in-out md:hidden flex flex-col pt-20",
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="flex flex-col flex-1 overflow-y-auto px-4 mt-4">
          {navLinks.map((link, i) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={(e) => handleNavClick(e, link.name, link.href)}
              className="group w-full px-6 py-4 border-b border-[rgba(255,255,255,0.05)] flex items-center justify-between text-[26px] font-bold tracking-tight text-white hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200"
              style={{ 
                transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(40px)',
                opacity: mobileMenuOpen ? 1 : 0,
                transition: `transform 0.4s ease ${i * 50 + 200}ms, opacity 0.4s ease ${i * 50 + 200}ms, background-color 0.2s ease`
              }}
            >
              {link.name}
              <ArrowRight className="w-6 h-6 text-[#6E6E73] group-hover:translate-x-1 transition-transform" />
            </Link>
          ))}
          
          <div className="flex flex-wrap gap-4 px-6 mt-8 mb-6" style={{
            opacity: mobileMenuOpen ? 1 : 0,
            transition: 'opacity 0.4s ease 500ms'
          }}>
            <Link to="/about" className="text-[16px] text-[#6E6E73] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>About</Link>
            <Link to="/contact" className="text-[16px] text-[#6E6E73] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            <Link to="/privacy" className="text-[16px] text-[#6E6E73] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Privacy</Link>
            <Link to="/terms" className="text-[16px] text-[#6E6E73] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Terms</Link>
            <Link to="/security" className="text-[16px] text-[#6E6E73] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>Security</Link>
            <Link to="/dpa" className="text-[16px] text-[#6E6E73] hover:text-white transition-colors" onClick={() => setMobileMenuOpen(false)}>DPA</Link>
          </div>
        </nav>

        <div className="p-6 bg-black border-t border-[rgba(255,255,255,0.05)] flex flex-col gap-3">
           <Link 
             to="/auth/signup" 
             onClick={() => setMobileMenuOpen(false)} 
             className={cn(
               "w-full py-3.5 bg-white text-black rounded-[980px] text-center text-[16px] font-bold tracking-tight",
               scrolled && "shadow-[0_0_20px_rgba(232,213,176,0.15)]"
             )}
           >
             Start Free Trial
           </Link>
           <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)} className="w-full py-3.5 border border-[rgba(255,255,255,0.2)] rounded-[980px] text-center text-white text-[16px] font-bold tracking-tight hover:bg-[rgba(255,255,255,0.05)] transition-colors">Sign In</Link>
        </div>
      </div>
    </>
  );
}
