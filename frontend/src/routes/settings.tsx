import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { User, Lock, Key, CreditCard } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBillingBalance, useRedeemCoupon } from '../api/billing'
import { useState } from 'react'
import { toast } from 'sonner'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { data: billing } = useBillingBalance()
  const redeemCoupon = useRedeemCoupon()
  const [couponCode, setCouponCode] = useState('')

  const handleRedeem = async () => {
    if (!couponCode.trim()) return
    try {
      const result = await redeemCoupon.mutateAsync(couponCode.trim())
      toast.success(result.message)
      setCouponCode('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Invalid coupon code')
    }
  }

  const totalCU = ((billing?.cuBalance || 0) + (billing?.grantedCuBalance || 0)).toFixed(4)
  const tierLabel = billing?.tier === 'none' ? 'No Active Plan' : `${(billing?.tier || '—').charAt(0).toUpperCase()}${(billing?.tier || '').slice(1)} Plan`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto py-12 px-6 space-y-10"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-foreground/30">
          <div className="h-px w-12 bg-primary"></div>
          <span className="text-primary">Configuration</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-sans font-black text-foreground uppercase tracking-tight">
          Settings
        </h1>
        <p className="font-sans text-sm text-foreground/50 font-light">
          Manage your account and preferences.
        </p>
      </div>

      <div className="space-y-px border border-border bg-foreground/10">
        {/* Profile */}
        <div className="bg-card p-8 hover:bg-secondary transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-4 w-4 text-primary" />
            <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">Profile</h2>
          </div>
          <p className="font-sans text-sm text-foreground/40 font-light mb-4">Update your personal information.</p>
          <p className="font-mono text-[10px] text-foreground/20 uppercase tracking-widest mb-4">Coming soon</p>
          <Button variant="outline" disabled>Edit Profile</Button>
        </div>

        {/* Security */}
        <div className="bg-card p-8 hover:bg-secondary transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-4 w-4 text-red-400/60" />
            <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">Security</h2>
          </div>
          <p className="font-sans text-sm text-foreground/40 font-light mb-4">Manage your password and authentication.</p>
          <Button variant="outline">Change Password</Button>
        </div>

        {/* API Keys */}
        <div className="bg-card p-8 opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <Key className="h-4 w-4 text-yellow-400/60" />
            <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">API Keys</h2>
          </div>
          <p className="font-sans text-sm text-foreground/40 font-light">Developer API access is coming in the next version.</p>
        </div>

        {/* Billing */}
        <div className="bg-card p-8 hover:bg-secondary transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-4 w-4 text-primary" />
            <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">Billing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <p className="font-mono text-[9px] text-foreground/40 uppercase tracking-widest mb-1">Current Plan</p>
              <p className="font-sans text-lg font-bold text-foreground">{tierLabel}</p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-foreground/40 uppercase tracking-widest mb-1">CU Balance</p>
              <p className="font-sans text-lg font-bold text-primary">{totalCU} CU</p>
            </div>
            <div>
              <p className="font-mono text-[9px] text-foreground/40 uppercase tracking-widest mb-1">Total Used</p>
              <p className="font-sans text-lg font-bold text-foreground/60">{(billing?.totalCuUsed || 0).toFixed(4)} CU</p>
            </div>
          </div>

          {/* Coupon Redemption */}
          <div className="border-t border-border pt-6">
            <p className="font-mono text-[9px] text-foreground/40 uppercase tracking-widest mb-3">Redeem Coupon</p>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Enter coupon code"
                className="flex-1 bg-background border border-border text-foreground font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-primary transition-colors uppercase max-w-xs"
              />
              <button
                onClick={handleRedeem}
                disabled={redeemCoupon.isPending || !couponCode.trim()}
                className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
              >
                {redeemCoupon.isPending ? 'Redeeming...' : 'Redeem'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
