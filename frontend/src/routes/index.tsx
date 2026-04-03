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
        ? 'bg-primary text-primary-foreground hover:bg-foreground hover:text-background'
        : 'text-foreground/60 hover:text-foreground bg-transparent'
    }`;
  };

  return (
    <div className="bg-background text-foreground min-h-screen w-full overflow-x-hidden selection:bg-primary selection:text-white relative font-sans scroll-smooth">
      {/* Background visual flair */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[80vw] h-[80vw] bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.04)_0%,transparent_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.08)_0%,transparent_60%)] blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/3"></div>
      </div>

      {/* Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border"
      >
        <div className="w-full max-w-[1600px] mx-auto px-6 md:px-12 lg:px-20 h-20 flex justify-between items-center relative z-50">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="bg-primary text-primary-foreground font-black font-sans text-xl tracking-tighter w-12 h-12 flex items-center justify-center shrink-0 no-underline">
            B8s
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-2">
            <div className="flex bg-secondary border border-border p-1">
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
                <Link to="/conversations/my" className="bg-primary text-primary-foreground font-mono text-xs px-4 py-2.5 transition-colors hover:bg-foreground hover:text-background uppercase tracking-widest border border-primary">
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/auth/login" className="font-mono text-xs px-4 py-2.5 text-foreground/60 hover:text-foreground uppercase tracking-widest transition-colors">
                    Login
                  </Link>
                  <Link to="/auth/register" className="bg-foreground/10 text-foreground font-mono text-xs px-4 py-2.5 transition-colors hover:bg-primary hover:text-foreground uppercase tracking-widest border border-foreground/20">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden flex items-center justify-center w-12 h-12 text-foreground hover:bg-foreground/10 transition-colors"
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
              className="absolute top-0 left-0 w-full bg-background/95 backdrop-blur-xl border-b border-border overflow-hidden md:hidden z-40 pt-20"
            >
              <div className="flex flex-col h-full bg-secondary w-full px-6 py-8">
                <nav className="flex flex-col gap-4 text-center mt-8">
                  <a 
                    href="#index" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-border text-foreground/80 hover:text-primary transition-colors"
                  >
                    Home
                  </a>
                  <a 
                    href="#features" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-border text-foreground/80 hover:text-primary transition-colors"
                  >
                    Features
                  </a>
                  <a 
                    href="#pricing" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-border text-foreground/80 hover:text-primary transition-colors"
                  >
                    Pricing
                  </a>
                  <a 
                    href="#get-started" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-mono text-xl uppercase tracking-widest py-4 border-b border-border text-foreground/80 hover:text-primary transition-colors"
                  >
                    Start
                  </a>
                </nav>

                <div className="mt-auto flex flex-col gap-4 pb-20">
                  {isAuthenticated ? (
                    <Link 
                      to="/conversations/my" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="bg-primary text-center text-primary-foreground font-mono text-sm py-4 transition-colors hover:bg-foreground hover:text-background uppercase tracking-widest w-full"
                    >
                      Go to Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link 
                        to="/auth/login" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-center font-mono text-sm py-4 text-foreground/60 hover:text-foreground uppercase tracking-widest transition-colors w-full border border-border bg-background/50"
                      >
                        Login
                      </Link>
                      <Link 
                        to="/auth/register" 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-center bg-primary text-primary-foreground font-mono text-sm py-4 transition-colors hover:bg-foreground hover:text-background uppercase tracking-widest w-full"
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
              <div className="h-px w-16 bg-primary"></div>
              <span className="text-primary">Your Personal AI Workforce</span>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="flex flex-col -space-y-4 md:-space-y-12 mb-12 select-none"
            >
              <h1 className="font-sans text-[3.5rem] sm:text-[5.5rem] md:text-[8rem] lg:text-[10.5rem] font-black text-foreground tracking-[-0.04em] leading-none m-0 p-0 uppercase">
                BLUEPRINTS
              </h1>
              <h1 className="font-sans text-[3.5rem] sm:text-[5.5rem] md:text-[8rem] lg:text-[10.5rem] font-black text-primary tracking-[-0.04em] leading-none m-0 p-0 uppercase drop-shadow-[0_0_80px_rgba(61,129,204,0.3)]">
                B8S
              </h1>
            </motion.div>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl"
            >
              <p className="font-sans text-lg sm:text-xl md:text-2xl text-foreground/70 font-light leading-relaxed mb-12">
                We build{' '}
                <span className="text-foreground border-b border-foreground/20 pb-1">
                  smart digital assistants
                </span>{' '}
                that do your repetitive work. They read your files, remember your conversations, and
                browse the web so you don't have to.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6">
                <Link
                  to="/auth/register"
                  className="bg-foreground text-background font-mono text-xs sm:text-sm uppercase px-6 sm:px-8 py-4 sm:py-5 tracking-widest hover:bg-primary hover:text-foreground transition-colors border border-foreground flex items-center justify-center gap-3 group"
                >
                  GET STARTED TODAY
                  <span className="opacity-50 group-hover:opacity-100 transition-opacity">→</span>
                </Link>
                <a
                  href="#features"
                  className="bg-transparent text-foreground font-mono text-xs sm:text-sm uppercase px-6 sm:px-8 py-4 sm:py-5 tracking-widest hover:bg-foreground/5 transition-colors border border-foreground/20 flex items-center justify-center gap-3"
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
            <h2 className="font-sans font-black text-4xl md:text-6xl text-foreground tracking-tight uppercase mb-4">
              Core Capabilities
            </h2>
            <div className="font-mono text-xs text-foreground/40 uppercase tracking-widest">
              WHY CHOOSE US
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-foreground/10 border border-border p-px"
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
                className="bg-card p-10 hover:bg-secondary transition-colors relative group overflow-hidden flex flex-col justify-start min-h-[350px]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p className="font-mono text-[10px] text-foreground/30 tracking-[0.2em] mb-4">{feature.num}</p>
                <h3 className="font-sans font-black text-2xl text-foreground mb-6 relative z-10 tracking-tight leading-none">
                  {feature.title}
                </h3>
                <p className="font-sans text-sm text-foreground/60 leading-relaxed font-light relative z-10">
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
            <h2 className="font-sans font-black text-4xl md:text-6xl text-foreground tracking-tight uppercase mb-4">
              Simple Pricing
            </h2>
            <div className="font-mono text-xs text-foreground/40 uppercase tracking-widest">
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
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex-1 bg-card border border-border p-10 hover:border-primary/50 transition-colors flex flex-col justify-between group rounded-none">
              <div>
                <div className="font-mono text-[10px] text-foreground/40 tracking-[0.2em] border-b border-border pb-4 mb-8">
                  FREE TIER
                </div>
                <h3 className="font-sans font-black text-5xl text-foreground mb-2">
                  $0<span className="text-xl text-foreground/30">/mo</span>
                </h3>
                <p className="font-sans text-sm text-foreground/60 mb-8 h-12">
                  New users testing agent capabilities. Activate with a coupon code.
                </p>
                <ul className="space-y-4 mb-12 font-mono text-xs text-foreground/80">
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> 2 Computing Units</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> ~5M Blended Tokens</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> All Models Included</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> Full Feature Access</li>
                </ul>
              </div>
              <Link to="/auth/register" className="w-full inline-block text-center bg-secondary border border-foreground/20 text-foreground font-mono text-xs py-4 uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-foreground transition-all">
                Get Started Free
              </Link>
            </motion.div>

            {/* Basic Tier */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex-1 bg-secondary border border-primary/50 p-10 relative flex flex-col justify-between shadow-[0_0_40px_rgba(61,129,204,0.1)] rounded-none">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground font-mono text-[9px] px-3 py-1 uppercase tracking-widest">
                POPULAR
              </div>
              <div>
                <div className="font-mono text-[10px] text-primary tracking-[0.2em] border-b border-border pb-4 mb-8">
                  BASIC PLAN
                </div>
                <h3 className="font-sans font-black text-5xl text-primary mb-2">
                  $10<span className="text-xl text-foreground/30">/mo</span>
                </h3>
                <p className="font-sans text-sm text-foreground/60 mb-8 h-12">
                  Hobbyists & solo developers building smarter workflows.
                </p>
                <ul className="space-y-4 mb-12 font-mono text-xs text-foreground/80">
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> 12 Computing Units</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> ~30M Blended Tokens</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> All Models Included</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> Full Feature Access</li>
                </ul>
              </div>
              <Link to="/auth/register" className="w-full inline-block text-center bg-primary text-primary-foreground font-mono text-xs py-4 uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors">
                Select Basic
              </Link>
            </motion.div>

            {/* Pro Tier */}
            <motion.div variants={fadeUp} transition={{ duration: 0.5 }} className="flex-1 bg-card border border-border p-10 hover:border-primary/50 transition-colors flex flex-col justify-between group rounded-none">
              <div>
                <div className="font-mono text-[10px] text-foreground/40 tracking-[0.2em] border-b border-border pb-4 mb-8">
                  PRO PLAN
                </div>
                <h3 className="font-sans font-black text-5xl text-foreground mb-2">
                  $30<span className="text-xl text-foreground/30">/mo</span>
                </h3>
                <p className="font-sans text-sm text-foreground/60 mb-8 h-12">
                  Power users running heavy agent workflows at scale.
                </p>
                <ul className="space-y-4 mb-12 font-mono text-xs text-foreground/80">
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> 40 Computing Units</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> ~100M Blended Tokens</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> All Models Included</li>
                  <li className="flex items-center gap-3"><span className="text-primary">+</span> Priority Support</li>
                </ul>
              </div>
              <Link to="/auth/register" className="w-full inline-block text-center bg-secondary border border-foreground/20 text-foreground font-mono text-xs py-4 uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-foreground transition-all">
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
            <p className="font-mono text-[11px] text-foreground/30 uppercase tracking-widest">
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
            className="bg-card border border-primary/30 p-12 md:p-20 text-center relative overflow-hidden rounded-none"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.08)_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.15)_0%,transparent_70%)] blur-2xl pointer-events-none"></div>

            <h2 className="font-sans font-black text-4xl md:text-7xl text-foreground tracking-tight uppercase mb-8 relative z-10">
              Stop Working.
              <br />
              <span className="text-primary">Start Commanding.</span>
            </h2>
            <p className="font-sans text-lg text-foreground/60 font-light max-w-2xl mx-auto mb-12 relative z-10">
              Stop fighting with hundreds of browser tabs and repetitive busywork. Launch your
              personal AI workforce today and get back to doing what matters.
            </p>

            <div className="flex justify-center relative z-10">
              <Link
                to="/auth/register"
                className="bg-primary text-primary-foreground font-mono text-xs uppercase px-12 py-5 tracking-widest hover:bg-foreground hover:text-background transition-colors"
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
          className="mt-20 pt-10 pb-10 border-t border-border flex flex-col md:flex-row justify-between items-center gap-6"
        >
          <div className="font-mono text-[10px] text-foreground/30 uppercase tracking-[0.3em] text-center md:text-left">
            © {new Date().getFullYear()} BLUEPRINTS (B8S). ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-8 font-mono text-[10px] text-foreground/50 uppercase tracking-[0.2em]">
            <a href="#index" className="hover:text-foreground transition-colors">HOME</a>
            <a href="#features" className="hover:text-foreground transition-colors">FEATURES</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">PRICING</a>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
