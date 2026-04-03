import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useLogin } from '../../api/auth';
import { useAuth } from '../../hooks/use-auth';
import { toast } from 'sonner';

export const Route = createFileRoute('/auth/login')({
  component: Login,
});

function Login() {
  const { login: authLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login.mutateAsync({ email, password, rememberMe });
      authLogin(data.token, { userId: data.userId, email: data.email, name: email.split('@')[0], role: 'user' });
      toast.success('Access granted.');
      navigate({ to: '/agents' });
    } catch (err: any) {
      toast.error('Access denied', { description: err.message });
      console.error('Login failed', err);
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
          <h1 className="font-sans font-black text-3xl text-foreground mb-2 uppercase tracking-tight">Login</h1>
          <p className="font-mono text-xs text-foreground/50 tracking-widest uppercase">Agent Network Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label htmlFor="email" className="font-mono text-[10px] text-foreground/50 tracking-widest uppercase block">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/20 px-0 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none transition-colors rounded-none placeholder:text-foreground/20"
              placeholder="user@system.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="font-mono text-[10px] text-foreground/50 tracking-widest uppercase block">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-foreground/20 px-0 py-3 font-mono text-sm text-foreground focus:border-primary focus:outline-none transition-colors rounded-none"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="rememberMe"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 accent-primary border-foreground/20 bg-transparent rounded-none"
            />
            <label htmlFor="rememberMe" className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          <button 
            type="submit" 
            disabled={login.isPending}
            className="w-full bg-secondary border border-foreground/20 text-foreground font-mono text-xs py-4 uppercase tracking-widest hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all disabled:opacity-50 mt-4 group"
          >
            {login.isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-border text-left">
          <p className="font-mono text-[10px] text-foreground/40 tracking-widest uppercase">
            New to the network?{' '}
            <Link to="/auth/register" className="text-primary hover:text-foreground transition-colors ml-2">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
