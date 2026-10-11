import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const Faq: React.FC = () => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is Kunda Space free to use?',
      a: 'Yes! Creating your profile, discovering members, viewing compatibility breakdowns, sending your first 3 messages to distinct members, and sending 3 replies are completely free. If you want to continue messaging beyond that, you can choose an affordable 3-Day Pass (1,500 RWF), Weekly Pass (3,000 RWF), or Pay-Per-Message (150 RWF).'
    },
    {
      q: 'How does Kunda Space verify that users are 18 or older?',
      a: 'We strictly calculate and validate your exact date of birth on our secure server during registration. Accounts belonging to users under 18 years of age are automatically rejected by our database constraints.'
    },
    {
      q: 'Why did my message get blocked when I tried to send my phone number?',
      a: 'For member security and anti-scam protection, our system restricts sharing direct phone numbers and external social handles in chat. To share contacts safely, both members can use the Direct Contact Unlock feature once mutual consent is granted.'
    },
    {
      q: 'How do payments work with Flutterwave?',
      a: 'We partner with Flutterwave to support MTN Mobile Money, Airtel Money, Visa, Mastercard, and bank cards. Funds are credited directly to your secure Kunda Space wallet ledger.'
    },
    {
      q: 'Can members outside Rwanda join Kunda Space?',
      a: 'Absolutely! While Kunda Space focuses on Rwanda and the Rwandan diaspora, verified adult members worldwide who appreciate Rwandan culture or wish to meet singles in Rwanda are welcome to join.'
    },
    {
      q: 'How do I report or block an inappropriate profile?',
      a: 'In any conversation or profile view, click the options icon to report or block the member immediately. Our moderation team investigates all reports thoroughly.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center space-y-4">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Help Center</span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-slate-600">
          Everything you need to know about Kunda Space matching, security, and memberships.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm"
          >
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
            >
              <span className="text-base font-bold text-slate-900">{item.q}</span>
              <ChevronDown
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  openIndex === idx ? 'rotate-180 text-rose-600' : ''
                }`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/50">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
