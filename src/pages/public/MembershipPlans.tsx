import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Check, ShieldCheck, Zap, Heart, MessageCircle } from 'lucide-react';

export const MembershipPlans: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          Transparent Pricing
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Membership Plans & Pricing
        </h1>
        <p className="text-lg text-slate-600">
          No hidden recurring fees. Pay only when you want to connect, with secure payments processed via Flutterwave.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Starter</span>
            <div className="text-4xl font-black text-slate-900">0 RWF</div>
            <p className="text-sm text-slate-600">{t('plans.freeDesc')}</p>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Full Profile Discovery
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> 3 Free Initial Outgoing Messages
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> 3 Free Conversation Replies
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Compatibility Score Breakdown
              </div>
            </div>
          </div>
          <Link to="/auth/register">
            <Button variant="outline" className="w-full">
              Get Started Free
            </Button>
          </Link>
        </div>

        {/* 3-Day Pass */}
        <div className="bg-white rounded-3xl p-8 border-2 border-rose-500 shadow-xl relative flex flex-col justify-between space-y-6">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-[11px] font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            Most Popular
          </div>
          <div className="space-y-4">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">3-Day Connection Pass</span>
            <div className="text-4xl font-black text-slate-900">1,500 RWF</div>
            <p className="text-sm text-slate-600">{t('plans.threeDayDesc')}</p>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited Messages for 72 Hours
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Message Anyone Without Per-Message Fees
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Priority Recommendation Status
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Safe Internal Chat Delivery
              </div>
            </div>
          </div>
          <Link to="/auth/register">
            <Button variant="primary" className="w-full shadow-md shadow-rose-200">
              Select 3-Day Pass
            </Button>
          </Link>
        </div>

        {/* Weekly Pass */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">Weekly Premium</span>
            <div className="text-4xl font-black text-slate-900">3,000 RWF</div>
            <p className="text-sm text-slate-600">{t('plans.weeklyDesc')}</p>
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Full 7 Days Unlimited Messaging
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Top Placement in Discover Feed
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> See Mutual Likes Immediately
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" /> Dedicated Moderation Support
              </div>
            </div>
          </div>
          <Link to="/auth/register">
            <Button variant="outline" className="w-full">
              Select Weekly Pass
            </Button>
          </Link>
        </div>
      </div>

      {/* Pay-as-you-go & Unlock Addons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-rose-500" /> Pay-Per-Message
            </h4>
            <span className="text-sm font-black text-slate-900">150 RWF / msg</span>
          </div>
          <p className="text-xs text-slate-600">
            Debited only when you send an individual message after exhausting your free allowance. No subscription commitment required.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Direct Contact Unlock
            </h4>
            <span className="text-sm font-black text-slate-900">2,000 RWF / contact</span>
          </div>
          <p className="text-xs text-slate-600">
            Reveals the member's verified phone number directly. Requires mutual consent from both parties.
          </p>
        </div>
      </div>
    </div>
  );
};
