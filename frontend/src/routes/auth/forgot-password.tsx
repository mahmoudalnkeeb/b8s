import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { apiClient } from '../../api/client';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/forgot-password')({
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      toast.success('If the email exists, a reset link has been sent');
    } catch (err: any) {
      toast.error('Failed to send reset email', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-background text-foreground min-h-screen w-full flex items-center justify-center p-6 relative font-sans selection:bg-primary selection:text-white">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.05)_0%,transparent_50%)] blur-3xl opacity-50"></div>
        </div>

        <div className="relative z-10 w-full max-w-md bg-card border border-border p-10 md:p-14 shadow-2xl text-center">
          <div className="w-16 h-16 bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="font-sans font-black text-2xl text-foreground mb-2 uppercase tracking-tight">Check Your Email</h1>
          <p className="font-mono text-xs text-foreground/50 tracking-widest uppercase mb-8">
            Reset link sent
          </p>
          
          <p className="font-sans text-sm text-foreground/40 font-light mb-8">
            We've sent a password reset link to <span className="text-foreground">{email}</span>. Check your inbox and click the link to reset your password.
          </p>

          <Link 
            to="/auth/login" 
            className="inline-block font-mono text-[10px] text-primary hover:text-foreground uppercase tracking-widest transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen w-full flex items-center justify-center p-6 relative font-sans selection:bg-primary selection:text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.05)_0%,transparent_50%)] blur-3xl opacity-50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-card border border-border p-10 md:p-14 shadow-2xl">
        <Link to="/" className="inline-block mb-12">
          <div className="bg-primary text-primary-foreground font-black font-sans text-xl tracking-tighter w-12 h-12 flex items-center justify-center">
            B8s
          </div>
        </Link>
        
        <div className="mb-10">
          <h1 className="font-sans font-black text-3xl text-foreground mb-2 uppercase tracking-tight">Forgot Password</h1>
          <p className="font-mono text-xs text-foreground/50 tracking-widest uppercase">Enter your email to reset</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label htmlFor="email" className="font-mono text-[10px] text-foreground/50 tracking-widest uppercase block">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/20 px-0 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors rounded-none placeholder:text-foreground/20"
              placeholder="user@system.com"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-secondary border border-foreground/20 text-foreground font-mono text-xs py-4 uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all disabled:opacity-50 mt-4 group"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-border text-left">
          <p className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase">
            Remember your password?{' '}
            <Link to="/auth/login" className="text-primary hover:text-foreground transition-colors ml-2">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}