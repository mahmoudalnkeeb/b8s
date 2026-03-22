import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../hooks/use-auth';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('index');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const sections = ['index', 'features', 'pricing', 'get-started'];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -60% 0px',
        threshold: 0,
      }
    );

    sections.forEach((section) => {
      const el = document.getElementById(section);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const getNavClass = (section: string) => {
    const isActive = activeSection === section;
    return `font-mono text-[10px] sm:text-xs px-3 sm:px-4 py-2 transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-[#3D81CC] text-white hover:bg-white hover:text-black'
        : 'text-white/60 hover:text-white bg-transparent'
    }`;
  };

  return (
    <div className="bg-black text-white min-h-screen w-full overflow-x-hidden selection:bg-[#3D81CC] selection:text-white relative font-sans scroll-smooth">
      {/* Background visual flair */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.08)_0%,transparent_60%)] blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/3"></div>
      </div>

      {/* Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-white/10"
      >
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 h-20 flex justify-between items-center relative z-50">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="bg-[#3D81CC] text-white font-black font-sans text-xl tracking-tighter w-12 h-12 flex items-center justify-center shrink-0 no-underline">
            B8s
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <div className="flex bg-[#111] border border-white/10 p-1">
              <a href="#index" className={getNavClass('index')}>
                <span className="opacity-50 mr-1 sm:mr-2">00</span>HOME
              </a>
              <a href="#features" className={getNavClass('features')}>
                <span className="opacity-50 mr-1 sm:mr-2">01</span>FEATURES
              </a>
              <a href="#pricing" className={getNavClass('pricing')}>
                <span className="opacity-50 mr-1 sm:mr-2">02</span>PRICING
              </a>
              <a href="#get-started" className={getNavClass('get-started')}>
                <span className="opacity-50 mr-1 sm:mr-2">03</span>START
              </a>
            </div>
            
            <div className="ml-4 flex items-center gap-2">
              {isAuthenticated ? (
                <Link to="/conversations/my" className="bg-[#3D81CC] text-white font-mono text-xs px-4 py-2.5 transition-colors hover:bg-white hover:text-black uppercase tracking-widest border border-[#3D81CC]">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/auth/login" className="font-mono text-xs px-4 py-2.5 text-white/60 hover:text-white uppercase tracking-widest transition-colors">
                    Login
                  </Link>
                  <Link to="/auth/register" className="bg-white/10 text-white font-mono text-xs px-4 py-2.5 transition-colors hover:bg-[#3D81CC] hover:text-white uppercase tracking-widest border border-white/20">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden flex items-center justify-center w-12 h-12 text-white hover:bg-white/10 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "100vh", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute top-0 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 overflow-hidden md:hidden z-40 pt-20"
            >
              <div className="flex flex-col h-full bg-[#111] w-full px-6 py-8">
                <nav className="flex flex-col gap-4 text-center mt-8">
                  <a 
                    href="#index" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-white/10 text-white/80 hover:text-[#3D81CC] transition-colors"
                  >
                    Home
                  </a>
                  <a 
                    href="#features" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-white/10 text-white/80 hover:text-[#3D81CC] transition-colors"
                  >
                    Features
                  </a>
                  <a 
                    href="#pricing" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-white/10 text-white/80 hover:text-[#3D81CC] transition-colors"
                  >
                    Pricing
                  </a>
                  <a 
                    href="#get-started" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-white/10 text-white/80 hover:text-[#3D81CC] transition-colors"
                  >
                    Start
                  </a>
                </nav>

                <div className="mt-auto flex flex-col gap-4 pb-20">
                  {isAuthenticated ? (
                    <Link 
                      to="/conversations/my" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="bg-[#3D81CC] text-center text-white font-mono text-sm py-4 transition-colors hover:bg-white hover:text-black uppercase tracking-widest w-full"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link 
                        to="/auth/login" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-center font-mono text-sm py-4 text-white/60 hover:text-white uppercase tracking-widest transition-colors w-full border border-white/10 bg-black/50"
                      >
                        Login
                      </Link>
                      <Link 
                        to="/auth/register" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-center bg-[#3D81CC] text-white font-mono text-sm py-4 transition-colors hover:bg-white hover:text-black uppercase tracking-widest w-full"
                      >
                        Get Started Free
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto min-h-screen px-6 md:px-12 lg:px-20 pt-40">
        {/* Main Hero */}
        <section id="index" className="flex flex-col justify-center min-h-[70vh]">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-6 mb-8 uppercase tracking-[0.3em] font-mono text-xs"
            >
              <div className="h-px w-16 bg-[#3D81CC]"></div>
              <span className="text-[#3D81CC]">Your Personal AI Workforce</span>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex flex-col -space-y-4 md:-space-y-12 mb-12 select-none"
            >
              <h1 className="font-sans text-[3.5rem] sm:text-[5.5rem] md:text-[8rem] lg:text-[10.5rem] font-black text-white tracking-[-0.04em] leading-none m-0 p-0 uppercase">
                BLUEPRINTS
              </h1>
              <h1 className="font-sans text-[3.5rem] sm:text-[5.5rem] md:text-[8rem] lg:text-[10.5rem] font-black text-[#3D81CC] tracking-[-0.04em] leading-none m-0 p-0 uppercase drop-shadow-[0_0_80px_rgba(61,129,204,0.3)]">
                B8S
              </h1>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl"
            >
              <p className="font-sans text-lg sm:text-xl md:text-2xl text-white/70 font-light leading-relaxed mb-12">
                We build{' '}
                <span className="text-white border-b border-white/20 pb-1">
                  smart digital assistants
                </span>{' '}
                that do your repetitive work. They read your files, remember your conversations, and
                browse the web so you don't have to.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6">
                <Link
                  to="/auth/register"
                  className="bg-white text-black font-mono text-xs sm:text-sm uppercase px-6 sm:px-8 py-4 sm:py-5 tracking-widest hover:bg-[#3D81CC] hover:text-white transition-colors border border-white flex items-center justify-center gap-3 group"
                >
                  GET STARTED TODAY
                  <span className="opacity-50 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
                <a
                  href="#features"
                  className="bg-transparent text-white font-mono text-xs sm:text-sm uppercase px-6 sm:px-8 py-4 sm:py-5 tracking-widest hover:bg-white/5 transition-colors border border-white/20 flex items-center justify-center gap-3"
                >
                  VIEW FEATURES
                </a>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 scroll-mt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="font-sans font-black text-4xl md:text-6xl text-white tracking-tight uppercase mb-4">
              Core Capabilities
            </h2>
            <div className="font-mono text-xs text-white/40 uppercase tracking-widest">
              WHY CHOOSE US
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10 p-px"
          >
            {[
              { num: '01', title: 'REMEMBERS EVERYTHING', desc: "Your assistant never forgets a detail. It keeps a perfect memory of your past conversations and projects, bringing up exactly what you need, when you need it." },
              { num: '02', title: 'READS YOUR DOCUMENTS', desc: "Upload massive PDFs, rulebooks, or data sheets. Ask a simple question, and the assistant instantly reads through everything to give you the exact highlighted answer." },
              { num: '03', title: 'SURFS THE WEB', desc: "Need to research something? The assistant can automatically open websites, read articles, and scrape the internet to summarize reports for you." },
              { num: '04', title: 'CHOOSE YOUR BRAIN', desc: "Not all tasks are the same. Switch instantly between the world's smartest AI brains—like ChatGPT, Claude, and Gemini—depending on what you need done." },
            ].map((feature) => (
              <motion.div
                key={feature.num}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="bg-[#0a0a0a] p-10 hover:bg-[#111] transition-colors relative group overflow-hidden flex flex-col justify-start min-h-[350px]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#3D81CC]/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="font-mono text-[10px] text-white/30 tracking-[0.2em] mb-4">{feature.num}</p>
                <h3 className="font-sans font-black text-2xl text-white mb-6 relative z-10 tracking-tight leading-none">
                  {feature.title}
                </h3>
                <p className="font-sans text-sm text-white/60 leading-relaxed font-light relative z-10">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-32 scroll-mt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mb-16 text-right"
          >
            <h2 className="font-sans font-black text-4xl md:text-6xl text-white tracking-tight uppercase mb-4">
              Simple Pricing
            </h2>
            <div className="font-mono text-xs text-white/40 uppercase tracking-widest">
              PAY FOR WHAT YOU USE
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="flex flex-col lg:flex-row gap-8"
          >
            {/* Free Tier */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex-1 bg-[#0a0a0a] border border-white/10 p-10 hover:border-[#3D81CC]/50 transition-colors flex flex-col justify-between group rounded-none">
              <div>
                <div className="font-mono text-[10px] text-white/40 tracking-[0.2em] border-b border-white/10 pb-4 mb-8">
                  FREE TIER
                </div>
                <h3 className="font-sans font-black text-5xl text-white mb-2">
                  $0<span className="text-xl text-white/30">/mo</span>
                </h3>
                <p className="font-sans text-sm text-white/60 mb-8 h-12">
                  New users testing agent capabilities. Activate with a coupon code.
                </p>
                <ul className="space-y-4 mb-12 font-mono text-xs text-white/80">
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> 2 Computing Units</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> ~5M Blended Tokens</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> All Models Included</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> Full Feature Access</li>
                </ul>
              </div>
              <Link to="/auth/register" className="w-full inline-block text-center bg-[#111] border border-white/20 text-white font-mono text-xs py-4 uppercase tracking-widest hover:bg-[#3D81CC] hover:border-[#3D81CC] hover:text-white transition-all">
                Get Started Free
              </Link>
            </motion.div>

            {/* Basic Tier */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex-1 bg-[#111] border border-[#3D81CC]/50 p-10 relative flex flex-col justify-between shadow-[0_0_40px_rgba(61,129,204,0.1)] rounded-none">
              <div className="absolute top-0 right-0 bg-[#3D81CC] text-white font-mono text-[9px] px-3 py-1 uppercase tracking-widest">
                POPULAR
              </div>
              <div>
                <div className="font-mono text-[10px] text-[#3D81CC] tracking-[0.2em] border-b border-white/10 pb-4 mb-8">
                  BASIC PLAN
                </div>
                <h3 className="font-sans font-black text-5xl text-[#3D81CC] mb-2">
                  $10<span className="text-xl text-white/30">/mo</span>
                </h3>
                <p className="font-sans text-sm text-white/60 mb-8 h-12">
                  Hobbyists & solo developers building smarter workflows.
                </p>
                <ul className="space-y-4 mb-12 font-mono text-xs text-white/80">
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> 12 Computing Units</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> ~30M Blended Tokens</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> All Models Included</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> Full Feature Access</li>
                </ul>
              </div>
              <Link to="/auth/register" className="w-full inline-block text-center bg-[#3D81CC] text-white font-mono text-xs py-4 uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                Select Basic
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex-1 bg-[#0a0a0a] border border-white/10 p-10 hover:border-[#3D81CC]/50 transition-colors flex flex-col justify-between group rounded-none">
              <div>
                <div className="font-mono text-[10px] text-white/40 tracking-[0.2em] border-b border-white/10 pb-4 mb-8">
                  PRO PLAN
                </div>
                <h3 className="font-sans font-black text-5xl text-white mb-2">
                  $30<span className="text-xl text-white/30">/mo</span>
                </h3>
                <p className="font-sans text-sm text-white/60 mb-8 h-12">
                  Power users running heavy agent workflows at scale.
                </p>
                <ul className="space-y-4 mb-12 font-mono text-xs text-white/80">
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> 40 Computing Units</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> ~100M Blended Tokens</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> All Models Included</li>
                  <li className="flex items-center gap-3"><span className="text-[#3D81CC]">+</span> Priority Support</li>
                </ul>
              </div>
              <Link to="/auth/register" className="w-full inline-block text-center bg-[#111] border border-white/20 text-white font-mono text-xs py-4 uppercase tracking-widest hover:bg-[#3D81CC] hover:border-[#3D81CC] hover:text-white transition-all">
                Select Pro
              </Link>
            </motion.div>
          </motion.div>

          {/* CU Info Note */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 text-center"
          >
            <p className="font-mono text-[11px] text-white/30 uppercase tracking-widest">
              1 CU ≈ 2.5M tokens&nbsp;&nbsp;·&nbsp;&nbsp;Same price for all models&nbsp;&nbsp;·&nbsp;&nbsp;Smart caching extends your CUs
            </p>
          </motion.div>
        </section>

        {/* Get Started Section */}
        <section id="get-started" className="py-32 scroll-mt-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.7 }}
            className="bg-[#0a0a0a] border border-[#3D81CC]/30 p-12 md:p-20 text-center relative overflow-hidden rounded-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.15)_0%,transparent_70%)] blur-2xl pointer-events-none"></div>

            <h2 className="font-sans font-black text-4xl md:text-7xl text-white tracking-tight uppercase mb-8 relative z-10">
              Stop Working.
              <br />
              <span className="text-[#3D81CC]">Start Commanding.</span>
            </h2>
            <p className="font-sans text-lg text-white/60 font-light max-w-2xl mx-auto mb-12 relative z-10">
              Stop fighting with hundreds of browser tabs and repetitive busywork. Launch your
              personal AI workforce today and get back to doing what matters.
            </p>

            <div className="flex justify-center relative z-10">
              <Link
                to="/auth/register"
                className="bg-[#3D81CC] text-white font-mono text-xs uppercase px-12 py-5 tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Create Free Account
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          transition={{ duration: 0.5 }}
          className="mt-20 pt-10 pb-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="font-mono text-[10px] text-white/30 uppercase tracking-[0.3em] text-center md:text-left">
            © {new Date().getFullYear()} BLUEPRINTS (B8S). ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-8 font-mono text-[10px] text-white/50 uppercase tracking-[0.2em]">
            <a href="#index" className="hover:text-white transition-colors">HOME</a>
            <a href="#features" className="hover:text-white transition-colors">FEATURES</a>
            <a href="#pricing" className="hover:text-white transition-colors">PRICING</a>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
