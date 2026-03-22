import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  useAdminUsers,
  useAdminAddCUs,
  useAdminCoupons,
  useAdminCreateCoupon,
  useAdminDeactivateCoupon,
} from '../../api/admin';
import type { AdminUser } from '../../api/admin';

export const Route = createFileRoute('/admin/')({
  component: AdminPage,
});

function AdminPage() {
  const { data: users, isLoading: usersLoading, error: usersError } = useAdminUsers();
  const { data: coupons, isLoading: couponsLoading } = useAdminCoupons();
  const addCUs = useAdminAddCUs();
  const createCoupon = useAdminCreateCoupon();
  const deactivateCoupon = useAdminDeactivateCoupon();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [cuAmount, setCuAmount] = useState('');
  const [asGranted, setAsGranted] = useState(true);

  // Coupon form
  const [couponCode, setCouponCode] = useState('');
  const [couponTier, setCouponTier] = useState('free');
  const [couponCuGrant, setCouponCuGrant] = useState('2');
  const [couponMaxUses, setCouponMaxUses] = useState('100');

  const [activeTab, setActiveTab] = useState<'users' | 'coupons'>('users');

  const handleAddCUs = async () => {
    if (!selectedUser || !cuAmount) return;
    try {
      await addCUs.mutateAsync({
        userId: selectedUser.userId,
        amount: parseFloat(cuAmount),
        asGranted,
      });
      toast.success(`Added ${cuAmount} CU to ${selectedUser.email}`);
      setSelectedUser(null);
      setCuAmount('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to add CUs');
    }
  };

  const handleCreateCoupon = async () => {
    try {
      await createCoupon.mutateAsync({
        code: couponCode || undefined,
        tier: couponTier,
        cuGrant: parseFloat(couponCuGrant),
        maxUses: parseInt(couponMaxUses),
      });
      toast.success('Coupon created');
      setCouponCode('');
      setCouponCuGrant('2');
      setCouponMaxUses('100');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create coupon');
    }
  };

  const handleDeactivate = async (code: string) => {
    try {
      await deactivateCoupon.mutateAsync(code);
      toast.success(`Coupon ${code} deactivated`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to deactivate');
    }
  };

  if (usersError) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-[#0a0a0a] border border-red-500/30 p-8 text-center max-w-md">
          <p className="font-mono text-xs text-red-400 uppercase tracking-widest mb-2">ACCESS DENIED</p>
          <p className="font-sans text-sm text-white/60">You do not have admin privileges.</p>
        </div>
      </div>
    );
  }

  const tabClass = (tab: string) =>
    `font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 transition-colors ${
      activeTab === tab
        ? 'bg-[#3D81CC] text-white'
        : 'text-white/40 hover:text-white bg-transparent'
    }`;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans font-black text-2xl md:text-3xl text-white tracking-tight uppercase">
            Admin Panel
          </h1>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest mt-1">
            USER & BILLING MANAGEMENT
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#111] border border-white/10 p-1 w-fit">
        <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
          Users
        </button>
        <button onClick={() => setActiveTab('coupons')} className={tabClass('coupons')}>
          Coupons
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Add CUs Modal */}
          {selectedUser && (
            <div className="bg-[#0a0a0a] border border-[#3D81CC]/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-mono text-xs text-[#3D81CC] uppercase tracking-widest">
                  Add CUs — {selectedUser.email}
                </p>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="font-mono text-[10px] text-white/30 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                >
                  ✕ CLOSE
                </button>
              </div>
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                    CU Amount
                  </label>
                  <input
                    type="number"
                    value={cuAmount}
                    onChange={(e) => setCuAmount(e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full bg-black border border-white/10 text-white font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-[#3D81CC] transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={asGranted}
                      onChange={(e) => setAsGranted(e.target.checked)}
                      className="accent-[#3D81CC]"
                    />
                    <span className="font-mono text-[10px] text-white/60 uppercase">Granted</span>
                  </label>
                </div>
                <button
                  onClick={handleAddCUs}
                  disabled={addCUs.isPending || !cuAmount}
                  className="bg-[#3D81CC] text-white font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
                >
                  {addCUs.isPending ? 'Adding...' : 'Add CUs'}
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0a0a0a]">
                    <th className="text-left font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Email</th>
                    <th className="text-left font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Name</th>
                    <th className="text-left font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Role</th>
                    <th className="text-left font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Tier</th>
                    <th className="text-right font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Balance</th>
                    <th className="text-right font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Granted</th>
                    <th className="text-right font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Used</th>
                    <th className="text-right font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center font-mono text-xs text-white/30">Loading...</td>
                    </tr>
                  ) : (
                    users?.map((user) => (
                      <tr key={user.userId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-white">{user.email}</td>
                        <td className="px-4 py-3 font-mono text-xs text-white/60">{user.name}</td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 ${user.role === 'admin' ? 'text-[#3D81CC] bg-[#3D81CC]/10' : 'text-white/40'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 ${
                            user.tier === 'none' ? 'text-white/30' :
                            user.tier === 'free' ? 'text-green-400/80' :
                            user.tier === 'basic' ? 'text-[#3D81CC]' :
                            'text-purple-400/80'
                          }`}>
                            {user.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white">{user.cuBalance.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white/60">{user.grantedCuBalance.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white/40">{user.totalCuUsed.toFixed(4)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="font-mono text-[10px] text-[#3D81CC] uppercase tracking-widest hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                          >
                            + Add CU
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          {/* Create Coupon Form */}
          <div className="bg-[#0a0a0a] border border-white/10 p-6">
            <p className="font-mono text-xs text-[#3D81CC] uppercase tracking-widest mb-4">
              Create Coupon
            </p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                  Code (optional)
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Auto-generate"
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-[#3D81CC] transition-colors uppercase"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                  Tier
                </label>
                <select
                  value={couponTier}
                  onChange={(e) => setCouponTier(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-[#3D81CC] transition-colors"
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                  CU Grant
                </label>
                <input
                  type="number"
                  value={couponCuGrant}
                  onChange={(e) => setCouponCuGrant(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-[#3D81CC] transition-colors"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] text-white/40 uppercase tracking-widest mb-1.5">
                  Max Uses
                </label>
                <input
                  type="number"
                  value={couponMaxUses}
                  onChange={(e) => setCouponMaxUses(e.target.value)}
                  className="w-full bg-black border border-white/10 text-white font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-[#3D81CC] transition-colors"
                />
              </div>
              <button
                onClick={handleCreateCoupon}
                disabled={createCoupon.isPending}
                className="bg-[#3D81CC] text-white font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-white hover:text-black transition-colors disabled:opacity-50 border-none cursor-pointer h-fit"
              >
                {createCoupon.isPending ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0a0a0a]">
                    <th className="text-left font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Code</th>
                    <th className="text-left font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Tier</th>
                    <th className="text-right font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">CU Grant</th>
                    <th className="text-right font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Uses</th>
                    <th className="text-left font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Status</th>
                    <th className="text-right font-mono text-[9px] text-white/40 uppercase tracking-widest px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {couponsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-mono text-xs text-white/30">Loading...</td>
                    </tr>
                  ) : coupons?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-mono text-xs text-white/30">No coupons yet</td>
                    </tr>
                  ) : (
                    coupons?.map((coupon) => (
                      <tr key={coupon.code} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-white font-bold">{coupon.code}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-white/60 uppercase">{coupon.tier}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white">{coupon.cuGrant}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs text-white/60">{coupon.usedCount}/{coupon.maxUses}</td>
                        <td className="px-4 py-3">
                          <span className={`font-mono text-[10px] uppercase tracking-widest ${coupon.active ? 'text-green-400/80' : 'text-red-400/60'}`}>
                            {coupon.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {coupon.active && (
                            <button
                              onClick={() => handleDeactivate(coupon.code)}
                              className="font-mono text-[10px] text-red-400/60 uppercase tracking-widest hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
                            >
                              Deactivate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
