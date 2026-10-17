import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
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
  MessageCircle,
  Heart,
  Smile,
  ChevronLeft,
  Check,
  CheckCheck,
  Search,
  MoreVertical,
  User,
  Info,
  Plus,
} from 'lucide-react';
import { api, getErrorMessage } from '../../lib/api';
import { CreateStoryModal } from '../../components/stories/CreateStoryModal';
import { StoryViewerModal, UserStoryGroup } from '../../components/stories/StoryViewerModal';

const QUICK_EMOJIS = ['❤️', '🔥', '😂', '😍', '👋', '✨', '🌹', '👍'];

export const Messages: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [selectedMessageForInfo, setSelectedMessageForInfo] = useState<any | null>(null);

  // Message Reactions Map: messageId -> reaction emoji string (e.g. '❤️')
  const [reactions, setReactions] = useState<Record<string, string>>({});
  // Heart animation tracker
  const [animatingHeartMsgId, setAnimatingHeartMsgId] = useState<string | null>(null);

  // Dynamic Allowances & status
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
  const [contactUnlockPrice, setContactUnlockPrice] = useState<number>(2000);

  // 24h Stories state
  const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState<boolean>(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  const fetchStories = async () => {
    try {
      const res = await api.get('/stories');
      if (res.data?.success && Array.isArray(res.data.storiesGrouped)) {
        setStoryGroups(res.data.storiesGrouped);
      }
    } catch (e) {
      console.warn('Stories fetch error:', e);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Fetch dynamic settings & plans on mount to guarantee dynamic prices & quotas
  useEffect(() => {
    fetchStories();
    api.get('/subscriptions/plans')
      .then((res) => {
        if (res.data?.success) {
          if (res.data.settings) {
            if (typeof res.data.settings.contactUnlockPrice === 'number') {
              setContactUnlockPrice(res.data.settings.contactUnlockPrice);
            }
            if (typeof res.data.settings.freeInitialMessages === 'number') {
              setAllowanceState((prev) => ({
                ...prev,
                initialRemaining: prev.initialRemaining === 3 ? res.data.settings.freeInitialMessages : prev.initialRemaining,
                repliesRemaining: prev.repliesRemaining === 3 ? res.data.settings.freeReplies : prev.repliesRemaining,
              }));
            }
          } else if (Array.isArray(res.data.plans)) {
            const unlockPlan = res.data.plans.find((p: any) => p.code === 'contact_unlock');
            if (unlockPlan && typeof unlockPlan.price === 'number') {
              setContactUnlockPrice(unlockPlan.price);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch conversation threads and live allowances
  const fetchConversations = async () => {
    if (!token) return;
    try {
      const res = await api.get('/messages/conversations');
      const data = res.data;
      if (data.success) {
        if (data.conversations) {
          setConversations(data.conversations);
          if (!selectedPartnerId && data.conversations.length > 0) {
            setSelectedPartnerId(data.conversations[0].partnerId);
          }
        }
        if (data.allowances) {
          setAllowanceState({
            initialRemaining: data.allowances.initialRemaining,
            repliesRemaining: data.allowances.repliesRemaining,
            hasActiveSubscription: Boolean(data.hasActiveSubscription),
          });
        }
        if (data.contactUnlockPrice) {
          setContactUnlockPrice(data.contactUnlockPrice);
        }
      }
    } catch (err) {
      console.error('Fetch conversations error:', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [token]);

  // 3. Fetch messages for selected partner
  const fetchMessages = async (partnerId: string) => {
    if (!token || !partnerId) return;
    try {
      setLoadingMessages(true);
      const res = await api.get(`/messages/send?partnerId=${partnerId}`);
      const data = res.data;
      if (data.success) {
        setMessages(data.messages || []);
        if (data.allowances) {
          setAllowanceState({
            initialRemaining: data.allowances.initialRemaining,
            repliesRemaining: data.allowances.repliesRemaining,
            hasActiveSubscription: data.hasActiveSubscription ?? false,
          });
        }
        if (data.contactUnlockPrice) {
          setContactUnlockPrice(data.contactUnlockPrice);
        }
        if (data.partnerName) {
          setActivePartnerData((prev: any) => ({
            ...prev,
            partnerId,
            partnerName: data.partnerName,
            partnerAvatar: data.partnerAvatar || prev?.partnerAvatar,
            partnerCity: data.partnerCity || prev?.partnerCity,
          }));
        }
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
      if (partner) {
        setActivePartnerData(partner);
        if (partner.isContactUnlocked && partner.partnerPhone) {
          setUnlockedPhone(partner.partnerPhone);
        }
      }
    }
  }, [selectedPartnerId, conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Double Tap / Double Click on message to react with ❤️ Heart (Instagram Style)
  const handleMessageDoubleTap = (messageId: string) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === '❤️' ? '' : '❤️',
    }));
    setAnimatingHeartMsgId(messageId);
    setTimeout(() => setAnimatingHeartMsgId(null), 1000);
  };

  // Add specific emoji reaction to message
  const handleAddReaction = (messageId: string, emoji: string) => {
    setReactions((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === emoji ? '' : emoji,
    }));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || messageInput).trim();
    if (!content || !selectedPartnerId || !token || sending) return;

    setSending(true);
    setModerationWarning(null);

    try {
      const res = await api.post('/messages/send', {
        recipientId: selectedPartnerId,
        content,
      });

      const data = res.data;

      if (data.success) {
        if (!textToSend) setMessageInput('');
        setShowEmojiPicker(false);
        setMessages((prev) => [...prev, data.message]);
        playNotificationSound();
        refreshBalance();
        fetchConversations();
        if (data.allowances) {
          setAllowanceState({
            initialRemaining: data.allowances.initialRemaining,
            repliesRemaining: data.allowances.repliesRemaining,
            hasActiveSubscription: data.hasActiveSubscription ?? allowanceState.hasActiveSubscription,
          });
        }
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
    if (!selectedPartnerId) {
      alert('Please select a conversation partner first.');
      return;
    }
    if (!token) return;
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
        alert(`🎉 Direct contact phone number revealed: ${data.phone}`);
      } else if (data.error === 'INSUFFICIENT_FUNDS') {
        setUnlockModalOpen(false);
        setIsDepositModalOpen(true);
      } else {
        alert(data.message || data.error || 'Failed to unlock contact.');
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

  const partnerDisplayName = activePartnerData?.partnerName || activePartnerData?.displayName || 'Member';

  const filteredConversations = conversations.filter((c) =>
    (c.partnerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMessage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-6 pb-24 md:pb-12">
      {/* Messaging Header Pill: Dynamic Allowance & Wallet Status (Hidden on mobile when chat active to maximize screen fit) */}
      <div className={`mb-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${selectedPartnerId ? 'hidden md:flex' : 'flex'}`}>
        <div className="flex flex-wrap items-center gap-2">
          {allowanceState.hasActiveSubscription ? (
            <Badge variant="violet" className="font-bold flex items-center gap-1.5 py-1 px-3">
              <Zap className="w-3.5 h-3.5 fill-violet-600" />
              <span>Unlimited Messaging Pass Active</span>
            </Badge>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="rose" className="font-bold py-1 px-3">
                {allowanceState.initialRemaining} Free Messages to New People
              </Badge>
              <Badge variant="slate" className="font-bold py-1 px-3">
                {allowanceState.repliesRemaining} Free Replies Remaining
              </Badge>
            </div>
          )}
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-3">
          <span>Wallet: <strong className="text-slate-900 font-bold">{balance.toLocaleString()} RWF</strong></span>
          <button
            onClick={() => setIsDepositModalOpen(true)}
            className="text-rose-600 font-bold hover:underline bg-rose-50 px-2.5 py-1 rounded-lg transition-colors"
          >
            + Top Up
          </button>
        </div>
      </div>

      {/* Main WhatsApp-Style Screen-Fitting Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-12 h-[calc(100dvh-75px)] md:h-[calc(100vh-140px)] min-h-[500px]">
        {/* LEFT COLUMN: Instagram Conversation List (Hidden on mobile when chat is active) */}
        <div
          className={`md:col-span-4 border-r border-slate-100 flex flex-col h-full ${
            selectedPartnerId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                Messages
                {conversations.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {conversations.length}
                  </span>
                )}
              </h2>
              <Link to="/dashboard/discover" className="text-xs text-rose-600 font-bold hover:underline">
                Find New Match
              </Link>
            </div>

            {/* Instagram Stories / Active Now Circles Bar with Add Story button */}
            <div className="flex gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-none items-center">
              {/* Add Story Button */}
              <button
                type="button"
                onClick={() => setIsCreateStoryOpen(true)}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
              >
                <div className="relative">
                  <div className="w-12 h-12 rounded-full p-0.5 border-2 border-dashed border-rose-400 group-hover:border-rose-600 flex items-center justify-center bg-rose-50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-sm">
                      <Plus className="w-5 h-5" />
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-800 max-w-[52px] truncate">
                  + Story
                </span>
              </button>

              {/* Active Stories from members */}
              {storyGroups.map((group, idx) => (
                <button
                  key={'story-group-' + group.userId}
                  onClick={() => setActiveStoryIndex(idx)}
                  className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 group-hover:scale-105 transition-transform">
                      <img
                        src={group.avatar}
                        alt={group.displayName}
                        className="w-full h-full rounded-full object-cover border-2 border-white"
                      />
                    </div>
                    {group.stories.length > 1 && (
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center border border-white absolute -bottom-0.5 -right-0.5">
                        {group.stories.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-700 max-w-[52px] truncate">
                    {group.displayName?.split(' ')[0]}
                  </span>
                </button>
              ))}

              {/* Active conversation fallbacks if no stories */}
              {storyGroups.length === 0 &&
                conversations.map((c) => (
                  <button
                    key={'story-' + c.partnerId}
                    onClick={() => setSelectedPartnerId(c.partnerId)}
                    className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-amber-400 via-rose-500 to-violet-600">
                        <img
                          src={c.partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={c.partnerName}
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                        />
                      </div>
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700 max-w-[52px] truncate">
                      {c.partnerName?.split(' ')[0]}
                    </span>
                  </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {/* Conversations Thread List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-16 px-4 text-slate-400 text-xs space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <p className="font-semibold text-slate-700">No conversations yet</p>
                <p className="text-[11px] text-slate-400">Like someone in Discover to start chatting!</p>
                <Link to="/dashboard/discover">
                  <Button size="sm" variant="outline" className="mt-2 text-xs">
                    Explore Discover
                  </Button>
                </Link>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedPartnerId === conv.partnerId;
                return (
                  <button
                    key={conv.partnerId}
                    onClick={() => {
                      setSelectedPartnerId(conv.partnerId);
                      setSearchParams({ user: conv.partnerId });
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-rose-50 text-rose-950 font-semibold shadow-sm'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <img
                        src={conv.partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={conv.partnerName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">{conv.partnerName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={`text-[11px] truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Instagram Direct Chat Window */}
        <div
          className={`md:col-span-8 flex flex-col justify-between h-full bg-white ${
            !selectedPartnerId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {!selectedPartnerId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-50 to-violet-50 text-rose-500 flex items-center justify-center shadow-inner border border-rose-100">
                <MessageCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-xl font-black text-slate-900">Your Messages</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Send private messages, build genuine rapport, and unlock direct contacts with mutual respect and consent.
                </p>
              </div>
              <Link to="/dashboard/discover">
                <Button size="sm" className="shadow-md shadow-rose-200">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Explore Verified Singles
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* WhatsApp Style Top Header */}
              <div className="p-3 sm:p-3.5 border-b border-slate-200 bg-[#f0f2f5] flex items-center justify-between shrink-0 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedPartnerId(null)}
                    className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-full"
                    title="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <img
                      src={activePartnerData?.partnerAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                      alt={partnerDisplayName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-300"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-[#111b21] flex items-center gap-1.5">
                      <span>{partnerDisplayName}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </h3>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      online • {activePartnerData?.partnerCity || 'Rwanda'}
                    </span>
                  </div>
                </div>

                {/* Direct Contact Phone Unlock Button / WhatsApp Link */}
                <div className="flex items-center gap-2">
                  {unlockedPhone ? (
                    <a
                      href={`https://wa.me/${unlockedPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold shadow-xs transition-colors"
                      title="Open chat in WhatsApp"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{unlockedPhone}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setUnlockModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-xs"
                      title="Unlock member direct telephone number"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Unlock Phone ({contactUnlockPrice.toLocaleString()} RWF)</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Moderation Alert Banner */}
              {moderationWarning && (
                <div className="m-2 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">{moderationWarning.reason}</span>
                    <p className="text-[11px] text-amber-800">{moderationWarning.safeSuggestion}</p>
                  </div>
                </div>
              )}

              {/* WhatsApp Message Stream with Beige Background & Smooth Upward Scroll */}
              <div
                className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2.5 bg-[#efeae2]"
                style={{
                  backgroundImage: 'radial-gradient(#e0d6c9 1px, transparent 1px)',
                  backgroundSize: '16px 16px',
                }}
              >
                {/* Date separator */}
                <div className="flex justify-center my-1">
                  <span className="bg-white/90 text-slate-600 text-[10px] font-bold px-3 py-0.5 rounded-lg shadow-xs uppercase tracking-wider">
                    Today
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="text-center py-16 text-slate-500 text-xs animate-pulse">
                    Loading WhatsApp messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 px-4 space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                      <MessageCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800">Chat with {partnerDisplayName}</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Messages are end-to-end moderated for mutual safety. Start the conversation with a warm greeting!
                      </p>
                    </div>
                    {/* Quick Starters */}
                    <div className="flex flex-wrap justify-center gap-2 pt-1">
                      {['Muraho neza 👋', 'Loved your bio! ✨', 'How is your week going? ☕', 'What is your favorite spot in Kigali? 🌿'].map((starter) => (
                        <button
                          key={starter}
                          onClick={() => handleSendMessage(starter)}
                          className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors shadow-xs"
                        >
                          {starter}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    const hasReaction = reactions[m.id];
                    const isHeartAnimating = animatingHeartMsgId === m.id;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col group relative ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        {/* WhatsApp Message Bubble */}
                        <div
                          onClick={() => setSelectedMessageForInfo(m)}
                          onDoubleClick={() => handleMessageDoubleTap(m.id)}
                          title="Click to view message delivered & read time"
                          className={`relative max-w-[85%] sm:max-w-[70%] px-3.5 py-2 text-xs sm:text-sm select-none cursor-pointer transition-all hover:brightness-95 ${
                            isMine
                              ? 'bg-[#d9fdd3] text-[#111b21] rounded-2xl rounded-tr-xs shadow-xs'
                              : 'bg-white text-[#111b21] rounded-2xl rounded-tl-xs shadow-xs'
                          }`}
                        >
                          <div className="pr-12 pb-1 break-words">{m.content}</div>

                          {/* WhatsApp Timestamp & Delivery Status Checkmarks */}
                          <div className="absolute bottom-1 right-2 flex items-center gap-1 select-none pointer-events-none">
                            <span className="text-[10px] text-slate-500">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && (
                              <span>
                                {m.isRead ? (
                                  <span title="Read / Seen">
                                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                  </span>
                                ) : (
                                  <span title="Delivered">
                                    <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                                  </span>
                                )}
                              </span>
                            )}
                          </div>

                          {/* Floating Heart Animation on Double Tap */}
                          {isHeartAnimating && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none animate-ping">
                              <Heart className="w-8 h-8 text-rose-500 fill-rose-500 drop-shadow-md" />
                            </span>
                          )}

                          {/* Reaction Pill Badge */}
                          {hasReaction && (
                            <span className="absolute -bottom-2 right-2 bg-white rounded-full px-1.5 py-0.5 text-xs border border-slate-200 shadow-xs animate-in zoom-in-75">
                              {hasReaction}
                            </span>
                          )}
                        </div>

                        {/* Quick Reaction Bar on Hover */}
                        <div
                          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mt-0.5 px-1 bg-white border border-slate-200 rounded-full shadow-xs py-0.5 z-10 ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {QUICK_EMOJIS.slice(0, 5).map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => handleAddReaction(m.id, emoji)}
                              className="hover:scale-125 transition-transform text-xs p-0.5"
                            >
                              {emoji}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setSelectedMessageForInfo(m)}
                            className="text-[10px] text-slate-500 hover:text-slate-800 px-1 border-l border-slate-200 ml-0.5"
                            title="Message Info"
                          >
                            Info
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Emoji Picker Tray */}
              {showEmojiPicker && (
                <div className="p-2.5 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1">Emojis:</span>
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMessageInput((prev) => prev + emoji)}
                      className="text-lg hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* WhatsApp Style Bottom Message Bar (Pinned to Screen Bottom) */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="p-2.5 sm:p-3 border-t border-slate-200 flex items-center gap-2 bg-[#f0f2f5] shrink-0"
              >
                {/* Emoji toggle icon */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition-colors ${
                    showEmojiPicker ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  title="Insert emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Message input */}
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder={`Type a message for ${partnerDisplayName}...`}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors shadow-2xs"
                />

                {/* WhatsApp Green Send Button */}
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-all"
                  title="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* WhatsApp Message Info Modal */}
      {selectedMessageForInfo && (
        <Modal
          isOpen={Boolean(selectedMessageForInfo)}
          onClose={() => setSelectedMessageForInfo(null)}
          title="Message Info"
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#d9fdd3] text-[#111b21] rounded-2xl shadow-xs text-xs sm:text-sm font-medium border border-emerald-200">
              {selectedMessageForInfo.content}
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 divide-y divide-slate-200 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" /> Read / Seen
                </span>
                <span className="text-slate-500 font-medium text-[11px]">
                  {selectedMessageForInfo.isRead
                    ? new Date(selectedMessageForInfo.createdAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Not read yet'}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-slate-400" /> Delivered
                </span>
                <span className="text-slate-500 font-medium text-[11px]">
                  {new Date(selectedMessageForInfo.createdAt).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setSelectedMessageForInfo(null)}
              className="w-full text-xs"
            >
              Close
            </Button>
          </div>
        </Modal>
      )}

      {/* Direct Contact Unlock Modal */}
      <Modal
        isOpen={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        title="Direct Contact Unlock"
      >
        <div className="space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <Unlock className="w-7 h-7" />
          </div>
          <div className="text-center space-y-1.5">
            <h4 className="text-base font-bold text-slate-900">
              Unlock {partnerDisplayName}'s Phone Number
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Contact unlocking costs <strong>{contactUnlockPrice.toLocaleString()} RWF</strong> from your wallet ledger and requires mutual consent.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl text-xs text-slate-600 space-y-1.5 border border-slate-100">
            <div className="flex justify-between">
              <span>Your Current Wallet Balance:</span>
              <strong className="text-slate-900 font-bold">{balance.toLocaleString()} RWF</strong>
            </div>
            <div className="flex justify-between">
              <span>Unlock Fee:</span>
              <strong className="text-rose-600 font-bold">{contactUnlockPrice.toLocaleString()} RWF</strong>
            </div>
          </div>

          <Button
            onClick={handleUnlockContact}
            loading={unlockLoading}
            className="w-full py-3 shadow-md shadow-rose-200"
          >
            Confirm & Unlock Phone Number ({contactUnlockPrice.toLocaleString()} RWF)
          </Button>
        </div>
      </Modal>

      {/* 24h Story Creation & Viewer Modals */}
      <CreateStoryModal
        isOpen={isCreateStoryOpen}
        onClose={() => setIsCreateStoryOpen(false)}
        onStoryCreated={() => {
          fetchStories();
        }}
      />

      {activeStoryIndex !== null && (
        <StoryViewerModal
          isOpen={true}
          userGroups={storyGroups}
          initialUserIndex={activeStoryIndex}
          onClose={() => setActiveStoryIndex(null)}
          onStoryDeleted={() => {
            fetchStories();
          }}
        />
      )}
    </div>
  );
};
