import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { User, Lock, Key, CreditCard, Plus, Trash2, Copy, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBillingBalance, useRedeemCoupon } from '../api/billing'
import { useState } from 'react'
import { toast } from 'sonner'
import { useChangePassword, useApiKeys, useCreateApiKey, useRevokeApiKey } from '../api/auth'
import { useAuth } from '../hooks/use-auth'

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
})

function SettingsPage() {
  const { user } = useAuth()
  const { data: billing } = useBillingBalance()
  const redeemCoupon = useRedeemCoupon()
  const changePassword = useChangePassword()
  const { data: apiKeys, isLoading: isLoadingKeys } = useApiKeys()
  const createApiKey = useCreateApiKey()
  const revokeApiKey = useRevokeApiKey()
  
  const [couponCode, setCouponCode] = useState('')
  
  // Change password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // API key creation state
  const [isCreatingKey, setIsCreatingKey] = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [newKeyName, setNewKeyName] = useState('')

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to change password')
    }
  }

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key')
      return
    }
    
    try {
      const result = await createApiKey.mutateAsync(newKeyName.trim())
      setNewKeyValue(result.key)
      setNewKeyName('')
      setIsCreatingKey(false)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create API key')
    }
  }

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      await revokeApiKey.mutateAsync(keyId)
      toast.success('API key revoked')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to revoke API key')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
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
          <p className="font-sans text-sm text-foreground/40 font-light mb-4">Your personal information.</p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest">Name: </span>
              <span className="text-foreground">{user?.name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest">Email: </span>
              <span className="text-foreground">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-card p-8 hover:bg-secondary transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="h-4 w-4 text-red-400/60" />
            <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">Security</h2>
          </div>
          <p className="font-sans text-sm text-foreground/40 font-light mb-4">Change your password.</p>
          
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="current-password" className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest block mb-2">Current Password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-background border border-border text-foreground font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors rounded-none"
                required
              />
            </div>
            <div>
              <label htmlFor="new-password" className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest block mb-2">New Password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-background border border-border text-foreground font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors rounded-none"
                minLength={8}
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest block mb-2">Confirm Password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-background border border-border text-foreground font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors rounded-none"
                minLength={8}
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={changePassword.isPending}
              className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 border-none cursor-pointer rounded-none"
            >
              {changePassword.isPending ? 'Changing...' : 'Change Password'}
            </Button>
          </form>
        </div>

        {/* API Keys */}
        <div className="bg-card p-8 hover:bg-secondary transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <Key className="h-4 w-4 text-yellow-400/60" />
            <h2 className="font-sans font-black text-lg text-foreground uppercase tracking-tight">API Keys</h2>
          </div>
          <p className="font-sans text-sm text-foreground/40 font-light mb-4">Manage your API keys for programmatic access.</p>
          
          {/* Show new key once */}
          {newKeyValue && (
            <div className="mb-6 p-4 bg-primary/10 border border-primary/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-primary" />
                <span className="font-mono text-[10px] text-primary uppercase tracking-widest">Copy your API key now - it won't be shown again</span>
              </div>
              <div className="flex gap-2">
                <code className="flex-1 bg-background px-3 py-2 font-mono text-xs text-foreground break-all">{newKeyValue}</code>
                <button 
                  onClick={() => copyToClipboard(newKeyValue)}
                  className="p-2 bg-primary text-primary-foreground hover:bg-foreground hover:text-background transition-colors border-none cursor-pointer rounded-none"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setNewKeyValue(null)}
                  className="px-3 py-2 bg-secondary text-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-colors border-none cursor-pointer rounded-none"
                >
                  Done
                </button>
              </div>
            </div>
          )}
          
          {/* Create new key form */}
          {isCreatingKey && !newKeyValue && (
            <div className="mb-6 p-4 bg-secondary">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Enter a name for this key"
                  className="flex-1 bg-background border border-border text-foreground font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors rounded-none"
                />
                <button 
                  onClick={handleCreateApiKey}
                  disabled={createApiKey.isPending}
                  className="px-4 py-2 bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 border-none cursor-pointer rounded-none"
                >
                  {createApiKey.isPending ? 'Creating...' : 'Create'}
                </button>
                <button 
                  onClick={() => { setIsCreatingKey(false); setNewKeyName(''); }}
                  className="px-4 py-2 bg-secondary text-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-colors border-none cursor-pointer rounded-none"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* API Keys list */}
          <div className="space-y-3">
            {isLoadingKeys ? (
              <p className="font-mono text-[10px] text-foreground/30 uppercase tracking-widest">Loading...</p>
            ) : apiKeys && apiKeys.length > 0 ? (
              apiKeys.map((key) => (
                <div key={key.keyId} className="flex items-center justify-between p-4 bg-secondary border border-border">
                  <div>
                    <p className="font-mono text-sm text-foreground">{key.name}</p>
                    <p className="font-mono text-[10px] text-foreground/40 uppercase tracking-widest">
                      {key.keyPrefix} • Created {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsedAt && ` • Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleRevokeApiKey(key.keyId)}
                    disabled={revokeApiKey.isPending}
                    className="p-2 text-foreground/40 hover:text-red-400 transition-colors border-none cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="font-mono text-[10px] text-foreground/30 uppercase tracking-widest">No API keys yet</p>
            )}
            
            {!isCreatingKey && !newKeyValue && (
              <button 
                onClick={() => setIsCreatingKey(true)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground font-mono text-[10px] uppercase tracking-widest hover:bg-foreground/10 transition-colors border-none cursor-pointer rounded-none"
              >
                <Plus className="h-4 w-4" />
                Create New Key
              </button>
            )}
          </div>
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
              <div className="relative flex-1 max-w-xs">
                <input
                  id="coupon-code"
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  maxLength={20}
                  className="w-full bg-background border border-border text-foreground font-mono text-xs px-3 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors uppercase rounded-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] text-foreground/30">
                  {couponCode.length}/20
                </span>
              </div>
              <button
                onClick={handleRedeem}
                disabled={redeemCoupon.isPending || !couponCode.trim()}
                className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer rounded-none"
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