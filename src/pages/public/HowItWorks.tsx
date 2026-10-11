import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/ui/Button';
import {
  UserCheck,
  Cpu,
  ShieldAlert,
  MessageSquare,
  Lock,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">
          Transparent Matchmaking
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          How Kunda Space Works
        </h1>
        <p className="text-lg text-slate-600">
          A step-by-step guide to our intentional matchmaking philosophy and privacy protection.
        </p>
      </div>

      <div className="space-y-12">
        {/* Step 1 */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-rose-600 uppercase">Step 1</span>
            <h3 className="text-2xl font-bold text-slate-900">Adult Verification (18+) & Profile Creation</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every member verifies their birth date. Minors are strictly prohibited. You describe your relationship intentions (serious relationship, marriage, or dating), hobbies, lifestyle, and upload genuine photos.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <Cpu className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-violet-600 uppercase">Step 2</span>
            <h3 className="text-2xl font-bold text-slate-900">Algorithmic Compatibility Breakdown</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our matching engine evaluates mutual relationship goals (25%), age alignment (20%), location (15%), shared interests (15%), and language compatibility (10%). You receive a clear 0–100 compatibility score with an explanation of why you matched.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-600 uppercase">Step 3</span>
            <h3 className="text-2xl font-bold text-slate-900">Anti-Scam Contact Locking & Safe Chat</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              To prevent online extortion and scammers from taking you off-platform prematurely, phone numbers and social links are automatically protected in chat. You start with free messages and replies to build real connection.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-600 uppercase">Step 4</span>
            <h3 className="text-2xl font-bold text-slate-900">Mutual Direct Contact Unlock</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Once mutual rapport is established and both parties consent, you can unlock each other's verified phone number directly for voice calls, WhatsApp, and face-to-face dates.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center pt-8">
        <Link to="/auth/register">
          <Button size="lg" className="px-10">
            Start Your Journey Now
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
