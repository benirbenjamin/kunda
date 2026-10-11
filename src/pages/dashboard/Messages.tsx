import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useWallet } from '../../contexts/WalletContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import {
  Send,
  Lock,
  Unlock,
  AlertTriangle,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';

export const Messages: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialPartnerId = searchParams.get('user');

  const { token, user } = useAuth();
  const { t } = useLanguage();
  const { balance, refreshBalance, setIsDepositModalOpen } = useWallet();
  const { playNotificationSound } = useNotifications();

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(initialPartnerId);
  const [activePartnerData, setActivePartnerData] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState<string>('');
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  // Allowances & status
  const [allowanceState, setAllowanceState] = useState<{
    initialRemaining: number;
    repliesRemaining: number;
    hasActiveSubscription: boolean;
  }>({ initialRemaining: 3, repliesRemaining: 3, hasActiveSubscription: false });

  // Moderation warning state
  const [moderationWarning, setModerationWarning] = useState<{
    reason: string;
    safeSuggestion: string;
    matchedPattern?: string;
  } | null>(null);

  // Contact Unlock Modal state
  const [unlockModalOpen, setUnlockModalOpen] = useState<boolean>(false);
  const [unlockLoading, setUnlockLoading] = useState<boolean>(false);
  const [unlockedPhone, setUnlockedPhone] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch conversation threads
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await api.get('/messages/conversations');
      const data = res.data;
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (!selectedPartnerId && data.conversations.length > 0) {
          setSelectedPartnerId(data.conversations[0].partnerId);
        }
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  // Fetch messages for selected partner
  const fetchMessages = async (partnerId: string) => {
    if (!token || !partnerId) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/messages/send?partnerId=${partnerId}`);
      const data = res.data;
      if (data.success) {
        setMessages(data.messages || []);
        setAllowanceState({
          initialRemaining: data.allowances?.initialRemaining ?? 3,
          repliesRemaining: data.allowances?.repliesRemaining ?? 3,
          hasActiveSubscription: data.hasActiveSubscription ?? false,
        });
        if (data.isContactUnlocked && data.partnerPhone) {
          setUnlockedPhone(data.partnerPhone);
        } else {
          setUnlockedPhone(null);
        }
      }
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedPartnerId) {
      fetchMessages(selectedPartnerId);
      const partner = conversations.find((c) => c.partnerId === selectedPartnerId);
      if (partner) setActivePartnerData(partner);
    }
  }, [selectedPartnerId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedPartnerId || !token || sending) return;

    setSending(true);
    setModerationWarning(null);

    try {
      const res = await api.post('/messages/send', {
        recipientId: selectedPartnerId,
        content: messageInput.trim(),
      });

      const data = res.data;

      if (data.success) {
        setMessageInput('');
        setMessages((prev) => [...prev, data.message]);
        playNotificationSound();
        refreshBalance();
        fetchConversations();
      }
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.error === 'CONTENT_MODERATION_VIOLATION') {
        setModerationWarning({
          reason: errData.reason,
          safeSuggestion: errData.safeSuggestion,
          matchedPattern: errData.matchedPattern,
        });
      } else if (errData?.error === 'INSUFFICIENT_FUNDS') {
        setIsDepositModalOpen(true);
      } else {
        alert(getErrorMessage(err));
      }
    } finally {
      setSending(false);
    }
  };

  const handleUnlockContact = async () => {
    if (!selectedPartnerId || !token) return;
    setUnlockLoading(true);

    try {
      const res = await api.post('/messages/unlock-contact', {
        targetUserId: selectedPartnerId,
      });
      const data = res.data;

      if (data.success && data.phone) {
        setUnlockedPhone(data.phone);
        setUnlockModalOpen(false);
        refreshBalance();
      } else if (data.error === 'INSUFFICIENT_FUNDS') {
        setUnlockModalOpen(false);
        setIsDepositModalOpen(true);
      } else {
        alert(data.message || data.error);
      }
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.error === 'INSUFFICIENT_FUNDS') {
        setUnlockModalOpen(false);
        setIsDepositModalOpen(true);
      } else {
        alert(getErrorMessage(err));
      }
    } finally {
      setUnlockLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Messaging Header Pill: Allowance status */}
      <div className="mb-4 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {allowanceState.hasActiveSubscription ? (
            <Badge variant="violet" className="font-bold flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-violet-600" /> Unlimited Messaging Pass Active
            </Badge>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="rose" className="font-bold">
                {allowanceState.initialRemaining} Free Messages to New People
              </Badge>
              <Badge variant="slate" className="font-bold">
                {allowanceState.repliesRemaining} Free Replies Remaining
              </Badge>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <span>Wallet: {balance.toLocaleString()} RWF</span>
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="text-rose-600 font-bold hover:underline"
          >
            + Top Up
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden min-h-[600px]">
        {/* Left: Conversation List */}
        <div className="border-r border-slate-100 p-4 space-y-3">
          <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
            Conversations
          </h2>

          {conversations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No conversations yet. Start a match in Discover!
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => setSelectedPartnerId(conv.partnerId)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                    selectedPartnerId === conv.partnerId
                      ? 'bg-rose-50 text-rose-950 font-semibold shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <img
                    src={conv.partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={conv.partnerName}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{conv.partnerName}</span>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Active Chat Stream */}
        <div className="md:col-span-2 flex flex-col justify-between h-[600px]">
          {/* Active Partner Chat Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <img
                src={activePartnerData?.partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={activePartnerData?.partnerName || 'Member'}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {activePartnerData?.partnerName || 'Member'}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {activePartnerData?.partnerCity || 'Rwanda'}
                </span>
              </div>
            </div>

            {/* Direct Contact Unlock Button or Unlocked Number */}
            <div>
              {unlockedPhone ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{unlockedPhone}</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUnlockModalOpen(true)}
                  className="text-xs"
                >
                  <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  Unlock Contact
                </Button>
              )}
            </div>
          </div>

          {/* Moderation Alert Banner (Shown when a contact leak attempt occurs) */}
          {moderationWarning && (
            <div className="m-3 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">{moderationWarning.reason}</span>
                <p className="text-[11px] text-amber-800">{moderationWarning.safeSuggestion}</p>
              </div>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {loadingMessages ? (
              <div className="text-center py-12 text-slate-400 text-xs">Loading messages...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs space-y-1">
                <p className="font-semibold text-slate-600">No messages exchanged yet.</p>
                <p>Say hello respectfully! Share what drew you to their profile.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMine = m.senderId === user?.id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm ${
                        isMine
                          ? 'bg-rose-500 text-white rounded-br-none shadow-sm'
                          : 'bg-slate-100 text-slate-900 rounded-bl-none'
                      }`}
                    >
                      {m.content}
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Write a warm, respectful message..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
            />
            <Button type="submit" loading={sending} disabled={!messageInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Direct Contact Unlock Modal */}
      <Modal
        isOpen={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        title="Direct Contact Unlock"
      >
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Unlock className="w-6 h-6" />
          </div>
          <div className="text-center space-y-1">
            <h4 className="text-base font-bold text-slate-900">
              Unlock {activePartnerData?.partnerName}'s Phone Number
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Contact unlocking costs <strong>2,000 RWF</strong> from your wallet ledger and requires mutual consent.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span>Your Wallet Balance:</span>
              <strong className="text-slate-900">{balance.toLocaleString()} RWF</strong>
            </div>
            <div className="flex justify-between">
              <span>Unlock Fee:</span>
              <strong className="text-rose-600">2,000 RWF</strong>
            </div>
          </div>

          <Button
            onClick={handleUnlockContact}
            loading={unlockLoading}
            className="w-full py-3"
          >
            Confirm & Unlock Phone Number
          </Button>
        </div>
      </Modal>
    </div>
  );
};
