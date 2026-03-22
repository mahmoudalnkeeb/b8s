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
          <h1 className="font-sans font-black text-3xl text-white mb-2 uppercase tracking-tight">
            Register
          </h1>
          <p className="font-mono text-xs text-white/50 tracking-widest uppercase">
            System Provisioning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-white/50 tracking-widest uppercase block">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white focus:border-[#3D81CC] focus:outline-none transition-colors rounded-none placeholder:text-white/20"
              placeholder="YOUR NAME"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-white/50 tracking-widest uppercase block">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-white/20 px-0 py-3 font-mono text-sm text-white focus:border-[#3D81CC] focus:outline-none transition-colors rounded-none placeholder:text-white/20"
              placeholder="USER@SYSTEM.COM"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[10px] text-white/50 tracking-widest uppercase block">
              Password
            </label>
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
            disabled={register.isPending}
            className="w-full bg-[#111] border border-[#3D81CC] text-[#3D81CC] font-mono text-xs py-4 uppercase tracking-widest hover:bg-[#3D81CC] hover:text-white transition-all disabled:opacity-50 mt-4 group"
          >
            {register.isPending ? 'Provisioning...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-white/10 text-left">
          <p className="font-mono text-[10px] text-white/40 tracking-widest uppercase">
            Already registered?{' '}
            <Link
              to="/auth/login"
              className="text-[#3D81CC] hover:text-white transition-colors ml-2"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
