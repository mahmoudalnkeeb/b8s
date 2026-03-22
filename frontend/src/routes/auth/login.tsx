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
  const login = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await login.mutateAsync({ email, password });
      authLogin(data.token, data.user);
      toast.success('Access granted.');
      navigate({ to: '/agents' });
    } catch (err: any) {
      toast.error('Access denied', { description: err.message });
      console.error('Login failed', err);
    }
  };

  return (
    <div className="bg-black text-white min-h-screen w-full flex items-center justify-center p-6 relative font-sans selection:bg-[#3D81CC] selection:text-white">
      {/* Background visual flair */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-[radial-gradient(circle_at_center,rgba(61,129,204,0.05)_0%,transparent_50%)] blur-3xl opacity-50"></div>
      </div>

      <div className="relative z-10 w-full max-w-md bg-[#0a0a0a] border border-white/10 p-10 md:p-14 shadow-2xl">
        <Link to="/" className="inline-block mb-12">
          <div className="bg-[#3D81CC] text-white font-black font-sans text-xl tracking-tighter w-12 h-12 flex items-center justify-center">
            B8s
          </div>
        </Link>
        
        <div className="mb-10">
          <h1 className="font-sans font-black text-3xl text-white mb-2 uppercase tracking-tight">Login</h1>
          <p className="font-mono text-xs text-white/50 tracking-widest uppercase">Agent Network Authentication</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-white/50 tracking-widest uppercase block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white focus:border-[#3D81CC] focus:outline-none transition-colors rounded-none placeholder:text-white/20"
              placeholder="user@system.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-white/50 tracking-widest uppercase block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white focus:border-[#3D81CC] focus:outline-none transition-colors rounded-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={login.isPending}
            className="w-full bg-[#111] border border-white/20 text-white font-mono text-xs py-4 uppercase tracking-widest hover:bg-[#3D81CC] hover:border-[#3D81CC] hover:text-white transition-all disabled:opacity-50 mt-4 group"
          >
            {login.isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/10 text-left">
          <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
            New to the network?{' '}
            <Link to="/auth/register" className="text-[#3D81CC] hover:text-white transition-colors ml-2">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
