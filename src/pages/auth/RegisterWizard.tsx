import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { SUPPORTED_COUNTRIES } from '../../../api/_lib/config';
import {
  User,
  Heart,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Lock,
  PlayCircle,
  UploadCloud,
  BookOpen,
} from 'lucide-react';

export const RegisterWizard: React.FC = () => {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [tutorialModalOpen, setTutorialModalOpen] = useState<boolean>(false);
  const [selectedTut, setSelectedTut] = useState<any>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  // Fetch registration tutorials posted by admin
  React.useEffect(() => {
    fetch('/api/tutorials')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.tutorials) {
          setTutorials(d.tutorials);
          if (d.tutorials.length > 0) setSelectedTut(d.tutorials[0]);
        }
      })
      .catch((err) => console.error('Failed to load tutorials:', err));
  }, []);

  // Handle direct Google Drive upload using refresh token method
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('kunda_token') || ''}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            filename: file.name,
            mimeType: file.type,
            isRegistration: true,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setFormData((prev) => ({ ...prev, primaryPhoto: data.url }));
        }
      } catch (uploadErr) {
        console.error('Drive upload failed, using local preview:', uploadErr);
        setFormData((prev) => ({ ...prev, primaryPhoto: base64 }));
      } finally {
        setUploadingPhoto(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Account & Location
    displayName: '',
    email: '',
    password: '',
    dob: '',
    gender: 'woman',
    interestedIn: 'men',
    country: 'Rwanda',
    city: 'Kigali',
    phoneCode: '+250',
    phone: '',
    preferredLanguage: language || 'en',

    // Step 2: Goals & Preferences
    relationshipIntention: 'serious_relationship',
    minAgePref: 21,
    maxAgePref: 40,
    datingScope: 'local',
    height: 168,
    occupation: '',
    education: 'University Degree',
    languages: ['English', 'Kinyarwanda'],
    interests: ['Coffee & Tea Tasting', 'Hiking in 1000 Hills', 'Tech & Entrepreneurship'] as string[],
    appearanceSkinTone: 'warm_deep',
    bio: '',

    // Step 3: Photos & Consent
    primaryPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    galleryPhotos: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    ],
    termsAccepted: false,
  });

  const availableInterests = [
    'Traditional Dance & Music',
    'Art & Photography',
    'Coffee & Tea Tasting',
    'Dining Out & Foodie',
    'Hiking in 1000 Hills',
    'Fitness & Gym',
    'Book Club & Reading',
    'Tech & Entrepreneurship',
    'Travel & Road Trips',
    'Faith & Spirituality',
  ];

  // Stock adult reference sample cards (licensed adult stock photography)
  const appearanceSamples = [
    {
      id: 'warm_deep',
      label: 'Deep & Rich Tone',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'warm_golden',
      label: 'Warm Golden Tone',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'caramel',
      label: 'Caramel & Bronze',
      imageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80',
    },
  ];

  // Selected country cities
  const selectedCountryObj = SUPPORTED_COUNTRIES.find((c) => c.name === formData.country) || SUPPORTED_COUNTRIES[0];

  const handleCountryChange = (countryName: string) => {
    const c = SUPPORTED_COUNTRIES.find((x) => x.name === countryName);
    if (c) {
      setFormData({
        ...formData,
        country: c.name,
        city: c.cities[0] || '',
        phoneCode: c.callingCode,
      });
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      if (exists) {
        return { ...prev, interests: prev.interests.filter((i) => i !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };

  // Client Age check helper (DOB must be >= 18)
  const isAdultDOB = (dobStr: string) => {
    if (!dobStr) return false;
    const dob = new Date(dobStr);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age >= 18;
  };

  const handleNextStep1 = () => {
    setError(null);
    if (!formData.displayName || !formData.email || !formData.password || !formData.dob) {
      setError('Please fill in all mandatory account fields.');
      return;
    }
    if (!isAdultDOB(formData.dob)) {
      setError(t('wizard.underageWarning'));
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep2 = () => {
    setError(null);
    if (!formData.bio || formData.bio.trim().length < 10) {
      setError('Please write at least a short sentence about yourself.');
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.termsAccepted) {
      setError('You must confirm you are 18+ and accept the Terms of Service to join.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          photos: [formData.primaryPhoto, ...formData.galleryPhotos],
        }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        login(data.token, data.user, data.profile);
        navigate(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(data.error || 'Registration failed. Please check your information.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Wizard Progress Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <span className={step >= 1 ? 'text-rose-600' : ''}>1. {t('wizard.step1')}</span>
          <span className={step >= 2 ? 'text-rose-600' : ''}>2. {t('wizard.step2')}</span>
          <span className={step >= 3 ? 'text-rose-600' : ''}>3. {t('wizard.step3')}</span>
        </div>
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-violet-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Watch Platform Tutorial Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-rose-50 border border-violet-100 p-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span className="text-xs font-bold text-violet-900">New to Kunda Space?</span>
          </div>
          <button
            type="button"
            onClick={() => setTutorialModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <PlayCircle className="w-3.5 h-3.5" /> Watch Platform Tutorials
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 sm:p-10 space-y-8">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-xs sm:text-sm text-red-600 font-semibold animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ACCOUNT & LOCATION */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{t('wizard.step1')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Tell us who you are. Kunda Space is strictly for adults 18 and older.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('wizard.fullName')}
                required
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="e.g. Diane or Keza"
              />

              <Input
                label={t('auth.emailLabel')}
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('auth.passwordLabel')}
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••••••"
              />

              <Input
                label={t('wizard.dob')}
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                helperText="Must be at least 18 years old today"
              />
            </div>

            {/* Gender and Interested In */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="woman">{t('wizard.woman')}</option>
                  <option value="man">{t('wizard.man')}</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.interestedIn')}
                </label>
                <select
                  value={formData.interestedIn}
                  onChange={(e) => setFormData({ ...formData, interestedIn: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  <option value="men">{t('wizard.interestedMen')}</option>
                  <option value="women">{t('wizard.interestedWomen')}</option>
                  <option value="everyone">{t('wizard.interestedEveryone')}</option>
                </select>
              </div>
            </div>

            {/* Country and City */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.country')}
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                >
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name} ({c.callingCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('wizard.city')}
                </label>
                <input
                  list="city-options"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="e.g. Kigali or Rubavu"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                />
                <datalist id="city-options">
                  {selectedCountryObj.cities.map((ct) => (
                    <option key={ct} value={ct} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Phone with Country Code & Privacy notice */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('wizard.phone')}
              </label>
              <div className="flex gap-2">
                <span className="inline-flex items-center px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                  {formData.phoneCode}
                </span>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="788 123 456"
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
                />
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                {t('wizard.phoneNotice')}
              </p>
            </div>

            <Button onClick={handleNextStep1} className="w-full py-3">
              {t('wizard.nextBtn')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 2: GOALS & MATCHING PREFERENCES */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{t('wizard.step2')}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Help our compatibility engine recommend the most suitable matches for you.
              </p>
            </div>

            {/* Relationship Intention */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t('wizard.relationshipIntention')}
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'serious_relationship', label: t('wizard.seriousRelationship') },
                  { id: 'marriage', label: t('wizard.marriage') },
                  { id: 'friendship', label: t('wizard.friendship') },
                  { id: 'casual_dating', label: t('wizard.casualDating') },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, relationshipIntention: item.id })}
                    className={`p-3 rounded-xl border text-xs font-semibold text-left transition-all ${
                      formData.relationshipIntention === item.id
                        ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Short Bio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {t('wizard.bio')}
              </label>
              <textarea
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder={t('wizard.bioPlaceholder')}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Interests & Passions Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                {t('wizard.interests')}
              </label>
              <div className="flex flex-wrap gap-2">
                {availableInterests.map((interest) => {
                  const selected = formData.interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selected
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sample Appearance Preference Preview (Licensed Stock Adult Photos) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                {t('wizard.skinTonePref')}
              </label>
              <p className="text-[11px] text-slate-400 mb-2.5">{t('wizard.skinToneNotice')}</p>
              <div className="grid grid-cols-3 gap-3">
                {appearanceSamples.map((samp) => (
                  <div
                    key={samp.id}
                    onClick={() => setFormData({ ...formData, appearanceSkinTone: samp.id })}
                    className={`cursor-pointer rounded-2xl border-2 overflow-hidden transition-all ${
                      formData.appearanceSkinTone === samp.id
                        ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md'
                        : 'border-slate-200 hover:border-slate-300 opacity-80'
                    }`}
                  >
                    <img src={samp.imageUrl} alt={samp.label} className="w-full h-24 object-cover" />
                    <div className="p-1.5 text-center bg-white">
                      <span className="text-[10px] font-bold text-slate-700 block">{samp.label}</span>
                      <span className="text-[9px] text-slate-400">Stock Reference</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('wizard.prevBtn')}
              </Button>
              <Button onClick={handleNextStep2} className="w-2/3">
                {t('wizard.nextBtn')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTOS & PUBLISHING */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-6">
            <div>
              <h2 className="text-2xl font-black text-slate-900">{t('wizard.step3')}</h2>
              <p className="text-xs text-slate-500 mt-1">{t('wizard.photosNotice')}</p>
            </div>

            {/* Primary Photo Preview & Google Drive Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {t('wizard.primaryPhoto')}
              </label>
              <div className="flex items-center gap-4">
                <img
                  src={formData.primaryPhoto}
                  alt="Primary profile preview"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-rose-500 shadow-sm"
                />
                <div className="flex-1 space-y-2">
                  <Input
                    value={formData.primaryPhoto}
                    onChange={(e) => setFormData({ ...formData, primaryPhoto: e.target.value })}
                    placeholder="Image URL or upload file to Google Drive below"
                  />
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingPhoto ? 'Uploading to Drive...' : 'Upload Image (Google Drive)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>
                    <span className="text-[10px] text-slate-400">Stored via Google Drive Refresh Token</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-500" /> Profile Review
              </div>
              <p>
                <strong>{formData.displayName}</strong>, based in {formData.city}, {formData.country}
              </p>
              <p>
                Seeking:{' '}
                <span className="text-rose-600 font-semibold">
                  {formData.relationshipIntention.replace('_', ' ')}
                </span>
              </p>
              <p>
                Interests: {formData.interests.slice(0, 3).join(', ')}
              </p>
            </div>

            {/* Terms and 18+ Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
                required
                checked={formData.termsAccepted}
                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <label htmlFor="terms" className="text-xs text-slate-600 leading-relaxed">
                {t('wizard.termsAgree')}
              </label>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setStep(2)} className="w-1/3">
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('wizard.prevBtn')}
              </Button>
              <Button type="submit" loading={loading} className="w-2/3 py-3 shadow-md shadow-rose-200">
                {t('wizard.publishBtn')}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Tutorials Modal Seen at Registration */}
      <Modal
        isOpen={tutorialModalOpen}
        onClose={() => setTutorialModalOpen(false)}
        title="Platform Guides & Tutorials"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Learn how to use Kunda Space safely, make meaningful connections, and optimize your dating profile.
          </p>

          {tutorials.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No tutorials published yet. Please check back soon!
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tutorial selector tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {tutorials.map((tut, idx) => (
                  <button
                    key={tut.id}
                    type="button"
                    onClick={() => setSelectedTut(tut)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedTut?.id === tut.id
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Guide #{idx + 1}
                  </button>
                ))}
              </div>

              {selectedTut && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    {language === 'rw' ? selectedTut.title_rw : language === 'fr' ? selectedTut.title_fr : selectedTut.title_en}
                  </h4>

                  {selectedTut.videoUrl && (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-sm">
                      <iframe
                        src={selectedTut.videoUrl}
                        title="Tutorial video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  {!selectedTut.videoUrl && selectedTut.imageUrl && (
                    <img
                      src={selectedTut.imageUrl}
                      alt="Tutorial illustration"
                      className="w-full h-44 object-cover rounded-xl shadow-sm"
                    />
                  )}

                  <p className="text-xs text-slate-700 leading-relaxed">
                    {language === 'rw' ? selectedTut.content_rw : language === 'fr' ? selectedTut.content_fr : selectedTut.content_en}
                  </p>
                </div>
              )}
            </div>
          )}

          <Button onClick={() => setTutorialModalOpen(false)} className="w-full">
            Got It! Continue Registration
          </Button>
        </div>
      </Modal>
    </div>
  );
};
