import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import {
  Shield,
  Users,
  Wallet,
  Settings,
  AlertTriangle,
  History,
  CheckCircle,
  Ban,
  UserCheck,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  PlayCircle,
  Mail,
  HardDrive,
  Eye,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { token, isAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tutorials' | 'settings' | 'moderation' | 'ledger'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [moderationEvents, setModerationEvents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState(1000);
  const [adjustReason, setAdjustReason] = useState('Promotional / Support Credit');

  // Tutorial Modal
  const [tutModalOpen, setTutModalOpen] = useState(false);
  const [tutForm, setTutForm] = useState({
    title_en: '',
    title_rw: '',
    title_fr: '',
    content_en: '',
    content_rw: '',
    content_fr: '',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    stepTag: 'step1',
    displayOrder: 1,
  });

  const fetchAdminData = async () => {
    if (!token) return;
    try {
      setLoading(true);

      // Metrics
      const mRes = await fetch('/api/admin/metrics', { headers: { Authorization: `Bearer ${token}` } });
      const mData = await mRes.json();
      if (mData.success) setMetrics(mData.metrics);

      // Users
      const uRes = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      const uData = await uRes.json();
      if (uData.success) setUsers(uData.users);

      // Settings
      const sRes = await fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } });
      const sData = await sRes.json();
      if (sData.success) setSettings(sData.settings);

      // Moderation
      const modRes = await fetch('/api/admin/moderation', { headers: { Authorization: `Bearer ${token}` } });
      const modData = await modRes.json();
      if (modData.success) setModerationEvents(modData.moderationEvents);

      // Ledger
      const lRes = await fetch('/api/admin/ledger', { headers: { Authorization: `Bearer ${token}` } });
      const lData = await lRes.json();
      if (lData.success) setTransactions(lData.transactions);

      // Tutorials
      const tutRes = await fetch('/api/tutorials?all=true');
      const tutData = await tutRes.json();
      if (tutData.success) setTutorials(tutData.tutorials);
    } catch (err) {
      console.error('Admin fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAdminData();
  }, [token]);

  // Action handlers
  const handleToggleSuspend = async (targetUserId: string, isSuspended: boolean) => {
    const action = isSuspended ? 'reactivate' : 'suspend';
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId, action }),
    });
    fetchAdminData();
  };

  const handleToggleVerification = async (targetUserId: string) => {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId, action: 'toggle_verification' }),
    });
    fetchAdminData();
  };

  const handleDeleteUser = async (targetUserId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete user "${name}"? This will delete all their profile, photos, matches, and transactions.`)) {
      return;
    }
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId, action: 'delete' }),
    });
    fetchAdminData();
  };

  const handleSetRole = async (targetUserId: string, role: string) => {
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ targetUserId, action: 'set_role', role }),
    });
    fetchAdminData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
    alert('Business settings, email credentials, and Google Drive configs updated successfully!');
  };

  const handleManualCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/ledger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        targetUserId: adjustUserId,
        amountMinor: adjustAmount,
        reason: adjustReason,
      }),
    });
    setAdjustModalOpen(false);
    fetchAdminData();
  };

  const handleCreateTutorial = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/tutorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        action: 'create',
        ...tutForm,
      }),
    });
    setTutModalOpen(false);
    fetchAdminData();
  };

  const handleDeleteTutorial = async (tutorialId: string) => {
    if (!confirm('Are you sure you want to delete this tutorial guide?')) return;
    await fetch('/api/tutorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'delete', tutorialId }),
    });
    fetchAdminData();
  };

  const handleToggleTutorial = async (tutorialId: string) => {
    await fetch('/api/tutorials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'toggle_active', tutorialId }),
    });
    fetchAdminData();
  };

  if (!isAdmin) {
    return (
      <div className="p-12 text-center text-slate-500">
        Access Denied. You do not possess administrative permissions.
      </div>
    );
  }

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-600" /> Kunda Space Admin Portal
          </h1>
          <p className="text-xs text-slate-500">
            Control members, delete users, post registration tutorials, configure Resend/SMTP and Google Drive
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAdminData}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh Data
        </Button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'overview', label: 'Overview Metrics', icon: Shield },
          { id: 'users', label: 'User Management', icon: Users },
          { id: 'tutorials', label: 'Registration Tutorials', icon: PlayCircle },
          { id: 'settings', label: 'Settings (Email & Drive)', icon: Settings },
          { id: 'moderation', label: 'Moderation Queue', icon: AlertTriangle },
          { id: 'ledger', label: 'Platform Ledger Audit', icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">Registered Users</span>
              <div className="text-3xl font-black text-slate-900 mt-1">{metrics.totalUsers}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">{metrics.activeMembers} active</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">Active Subscriptions</span>
              <div className="text-3xl font-black text-violet-600 mt-1">{metrics.activeSubscriptions}</div>
              <span className="text-[11px] text-slate-500">3-Day & Weekly passes</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">Lifetime Deposits</span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {metrics.totalDepositsRWF.toLocaleString()} RWF
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Flutterwave processed</span>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
              <span className="text-xs font-bold text-slate-400 uppercase">Moderation Alerts</span>
              <div className="text-3xl font-black text-amber-500 mt-1">{metrics.moderationEventsCount}</div>
              <span className="text-[11px] text-slate-500">Contact leaks intercepted</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. USER MANAGEMENT TAB */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-violet-500"
              />
            </div>
            <span className="text-xs text-slate-400">{filteredUsers.length} members found</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Member</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Wallet</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {u.displayName}
                        {u.verifiedBadge && <Badge variant="emerald" size="sm">Verified</Badge>}
                      </div>
                      <span className="text-[11px] text-slate-400">{u.email}</span>
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleSetRole(u.id, e.target.value)}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 bg-white"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="p-3 text-slate-600">{u.city}, {u.country}</td>
                    <td className="p-3 font-black text-slate-900">{u.walletBalance.toLocaleString()} RWF</td>
                    <td className="p-3">
                      <Badge variant={u.isSuspended ? 'amber' : 'emerald'} size="sm">
                        {u.isSuspended ? 'Suspended' : 'Active'}
                      </Badge>
                    </td>
                    <td className="p-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleToggleVerification(u.id)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                        title="Toggle verification badge"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleSuspend(u.id, u.isSuspended)}
                        className={`p-1.5 rounded-lg border ${
                          u.isSuspended
                            ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                        }`}
                        title={u.isSuspended ? 'Reactivate' : 'Suspend account'}
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.displayName)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                        title="Permanently delete user and all associated data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TUTORIALS TAB (Seen at registration by users) */}
      {activeTab === 'tutorials' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Registration & Onboarding Tutorials</h3>
              <p className="text-xs text-slate-500">
                Tutorials posted here are displayed interactively in the registration wizard for new members
              </p>
            </div>
            <Button size="sm" onClick={() => setTutModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Post New Tutorial
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tutorials.map((tut) => (
              <div key={tut.id} className="p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="violet" size="sm">{tut.stepTag || 'all steps'}</Badge>
                    <Badge variant={tut.isActive ? 'emerald' : 'slate'} size="sm">
                      {tut.isActive ? 'Active' : 'Draft'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{tut.title_en}</h4>
                  <p className="text-xs text-slate-600 line-clamp-3">{tut.content_en}</p>
                  {tut.videoUrl && (
                    <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" /> Video attached
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleToggleTutorial(tut.id)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    {tut.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteTutorial(tut.id)}
                    className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SETTINGS TAB (Business pricing, Resend, SMTP, Google Drive) */}
      {activeTab === 'settings' && settings && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 space-y-8 max-w-3xl">
          {/* Section 1: Business Pricing & Allowances */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Business Pricing & Free Allowances
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Free Initial Messages"
                type="number"
                value={settings.freeInitialMessages}
                onChange={(e) => setSettings({ ...settings, freeInitialMessages: e.target.value })}
              />
              <Input
                label="Free Distinct Recipients"
                type="number"
                value={settings.freeDistinctRecipients}
                onChange={(e) => setSettings({ ...settings, freeDistinctRecipients: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Free Replies Allowed"
                type="number"
                value={settings.freeReplies}
                onChange={(e) => setSettings({ ...settings, freeReplies: e.target.value })}
              />
              <Input
                label="Pay-Per-Message Price (RWF)"
                type="number"
                value={settings.payPerMessagePrice}
                onChange={(e) => setSettings({ ...settings, payPerMessagePrice: e.target.value })}
              />
            </div>

            <Input
              label="Direct Contact Unlock Price (RWF)"
              type="number"
              value={settings.contactUnlockPrice}
              onChange={(e) => setSettings({ ...settings, contactUnlockPrice: e.target.value })}
            />
          </div>

          {/* Section 2: Email Configuration (Resend vs SMTP) */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-rose-500" /> Email Verification & Password Recovery Provider
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Active Email Provider
              </label>
              <select
                value={settings.emailProvider}
                onChange={(e) => setSettings({ ...settings, emailProvider: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              >
                <option value="resend">Resend API</option>
                <option value="smtp">SMTP (Gmail, SendGrid, Amazon SES)</option>
                <option value="mock">Mock / Console (Local Testing)</option>
              </select>
            </div>

            {settings.emailProvider === 'resend' && (
              <div className="space-y-3 p-4 bg-rose-50/50 rounded-2xl border border-rose-100">
                <Input
                  label="Resend API Key"
                  type="password"
                  value={settings.resendApiKey}
                  onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxx"
                />
                <Input
                  label="Resend From Email"
                  value={settings.resendFromEmail}
                  onChange={(e) => setSettings({ ...settings, resendFromEmail: e.target.value })}
                  placeholder="Kunda Space <onboarding@resend.dev>"
                />
              </div>
            )}

            {settings.emailProvider === 'smtp' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="SMTP Host"
                    value={settings.smtpHost}
                    onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                  <Input
                    label="SMTP Port"
                    type="number"
                    value={settings.smtpPort}
                    onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
                    placeholder="587"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="SMTP Username"
                    value={settings.smtpUser}
                    onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  />
                  <Input
                    label="SMTP Password"
                    type="password"
                    value={settings.smtpPass}
                    onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Google Drive Refresh Token Configuration */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-600" /> Google Drive Storage (Refresh Token Method)
            </h3>
            <p className="text-xs text-slate-500">
              User uploaded profile pictures and media are saved directly to Google Drive using your OAuth2 refresh token.
            </p>

            <div className="space-y-3 p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100">
              <Input
                label="Google Client ID"
                value={settings.googleDriveClientId}
                onChange={(e) => setSettings({ ...settings, googleDriveClientId: e.target.value })}
                placeholder="xxxx.apps.googleusercontent.com"
              />
              <Input
                label="Google Client Secret"
                type="password"
                value={settings.googleDriveClientSecret}
                onChange={(e) => setSettings({ ...settings, googleDriveClientSecret: e.target.value })}
                placeholder="GOCSPX-xxxxxxxxxxxx"
              />
              <Input
                label="Google OAuth Refresh Token"
                type="password"
                value={settings.googleDriveRefreshToken}
                onChange={(e) => setSettings({ ...settings, googleDriveRefreshToken: e.target.value })}
                placeholder="1//xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <Input
                label="Target Google Drive Folder ID (Optional)"
                value={settings.googleDriveFolderId}
                onChange={(e) => setSettings({ ...settings, googleDriveFolderId: e.target.value })}
                placeholder="1a2b3c4d5e6f..."
              />
            </div>
          </div>

          <Button type="submit" className="w-full py-3">
            Save All Platform Settings
          </Button>
        </form>
      )}

      {/* 5. MODERATION QUEUE TAB */}
      {activeTab === 'moderation' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Intercepted Phone & Social Media Leaks</h3>
          {moderationEvents.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">No moderation violations recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {moderationEvents.map((evt) => (
                <div key={evt.id} className="py-4 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{evt.userDisplayName} ({evt.userEmail})</span>
                    <Badge variant="amber" size="sm">{evt.eventType}</Badge>
                  </div>
                  <p className="p-2.5 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700">
                    "{evt.rawContent}"
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Action: {evt.actionTaken}</span>
                    <span>{new Date(evt.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. LEDGER TAB */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Platform Transaction Ledger Audit</h3>
            <Button size="sm" onClick={() => setAdjustModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Manual Adjustment Credit
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3 font-mono">Reference</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.reference} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-400">{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 font-bold text-slate-900">{tx.userDisplayName || tx.userEmail}</td>
                    <td className="p-3 capitalize">{tx.type?.replace('_', ' ')}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{tx.description}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">{tx.reference}</td>
                    <td className="p-3 text-right font-black">
                      <span className={tx.amountMinor > 0 ? 'text-emerald-600' : 'text-slate-900'}>
                        {tx.amountMinor > 0 ? `+${tx.amountMinor.toLocaleString()}` : tx.amountMinor.toLocaleString()} {tx.currency || 'RWF'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Credit Adjustment Modal */}
      <Modal isOpen={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title="Manual Credit Adjustment">
        <form onSubmit={handleManualCredit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Target User</label>
            <select
              value={adjustUserId}
              onChange={(e) => setAdjustUserId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              required
            >
              <option value="">Select Member</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.displayName} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Credit Amount (RWF)"
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(Number(e.target.value))}
            required
          />

          <Input
            label="Audit Reason"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            required
          />

          <Button type="submit" className="w-full">
            Authorize & Execute Credit
          </Button>
        </form>
      </Modal>

      {/* Create New Registration Tutorial Modal */}
      <Modal isOpen={tutModalOpen} onClose={() => setTutModalOpen(false)} title="Post New Platform Tutorial">
        <form onSubmit={handleCreateTutorial} className="space-y-4">
          <Input
            label="Title (English)"
            value={tutForm.title_en}
            onChange={(e) => setTutForm({ ...tutForm, title_en: e.target.value })}
            placeholder="e.g. How to optimize your Kunda profile"
            required
          />
          <Input
            label="Title (Kinyarwanda)"
            value={tutForm.title_rw}
            onChange={(e) => setTutForm({ ...tutForm, title_rw: e.target.value })}
            placeholder="e.g. Uko wuzuza umwirondoro ukurura abagukunda"
          />
          <Input
            label="Title (French)"
            value={tutForm.title_fr}
            onChange={(e) => setTutForm({ ...tutForm, title_fr: e.target.value })}
            placeholder="e.g. Comment optimiser votre profil Kunda"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Content (English)</label>
            <textarea
              rows={3}
              value={tutForm.content_en}
              onChange={(e) => setTutForm({ ...tutForm, content_en: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              required
            />
          </div>

          <Input
            label="YouTube Video Embed URL (Optional)"
            value={tutForm.videoUrl}
            onChange={(e) => setTutForm({ ...tutForm, videoUrl: e.target.value })}
            placeholder="https://www.youtube.com/embed/..."
          />

          <Input
            label="Illustration Image URL"
            value={tutForm.imageUrl}
            onChange={(e) => setTutForm({ ...tutForm, imageUrl: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Registration Step Tag</label>
            <select
              value={tutForm.stepTag}
              onChange={(e) => setTutForm({ ...tutForm, stepTag: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            >
              <option value="all">All Steps</option>
              <option value="step1">Step 1: Account & Location</option>
              <option value="step2">Step 2: Intentions & Preferences</option>
              <option value="step3">Step 3: Photos & Publishing</option>
              <option value="wallet">Wallet & Messaging</option>
            </select>
          </div>

          <Button type="submit" className="w-full">
            Publish Tutorial to Users
          </Button>
        </form>
      </Modal>
    </div>
  );
};
