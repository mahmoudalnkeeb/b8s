import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useRegister } from '../../api/auth';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/register')({
  component: Register,
});

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const register = useRegister();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register.mutateAsync({ email, password, name });
      toast.success('Registration verified. Awaiting login.');
      navigate({ to: '/auth/login' });
    } catch (err: any) {
      toast.error('Registration failed', { description: err.message });
      console.error('Registration failed', err);
    }
  };

  return (
    <div className="bg-background text-foreground min-h-screen w-full flex items-center justify-center p-6 relative font-sans selection:bg-primary selection:text-white">
      {/* Background visual flair */}
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
          <h1 className="font-sans font-black text-3xl text-foreground mb-2 uppercase tracking-tight">
            Register
          </h1>
          <p className="font-mono text-xs text-foreground/50 tracking-widest uppercase">
            System Provisioning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label htmlFor="name" className="font-mono text-[10px] text-foreground/50 tracking-widest uppercase block">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/20 px-0 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors rounded-none placeholder:text-foreground/20"
              placeholder="YOUR NAME"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="font-mono text-[10px] text-foreground/50 tracking-widest uppercase block">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/20 px-0 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors rounded-none placeholder:text-foreground/20"
              placeholder="USER@SYSTEM.COM"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="font-mono text-[10px] text-foreground/50 tracking-widest uppercase block">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/20 px-0 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors rounded-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={register.isPending}
            className="w-full bg-secondary border border-primary text-primary font-mono text-xs py-4 uppercase tracking-widest hover:bg-primary hover:text-foreground transition-all disabled:opacity-50 mt-4 group"
          >
            {register.isPending ? 'Provisioning...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-border text-left">
          <p className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase">
            Already registered?{' '}
            <Link
              to="/auth/login"
              className="text-primary hover:text-foreground transition-colors ml-2"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
