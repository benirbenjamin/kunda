import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Camera, Check, ShieldCheck, User } from 'lucide-react';

export const Profile: React.FC = () => {
  const { profile, updateProfile, token } = useAuth();
  const { t } = useLanguage();

  const [photos, setPhotos] = useState<string[]>(
    profile?.photos && profile.photos.length > 0
      ? profile.photos
      : ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80']
  );
  const [uploading, setUploading] = useState<boolean>(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || 'Kigali');
  const [country, setCountry] = useState(profile?.country || 'Rwanda');
  const [height, setHeight] = useState(profile?.height || 170);
  const [intention, setIntention] = useState(profile?.relationshipIntention || 'serious_relationship');
  const [consent, setConsent] = useState(profile?.contactSharingConsent ?? true);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileBase64: base64,
            filename: file.name,
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        if (data.success && data.url) {
          setPhotos((prev) => [data.url, ...prev.slice(1)]);
        } else {
          setPhotos((prev) => [base64, ...prev.slice(1)]);
        }
      } catch (err) {
        console.error('Failed to upload photo:', err);
        setPhotos((prev) => [base64, ...prev.slice(1)]);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    const updated = {
      ...profile,
      photos,
      displayName,
      bio,
      city,
      country,
      height: Number(height),
      relationshipIntention: intention,
      contactSharingConsent: consent,
    };
    updateProfile(updated);
    setSavedMessage('Profile successfully updated!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900">{t('nav.profile')}</h1>
        <p className="text-xs text-slate-500">Manage your photos, personal bio, and privacy settings</p>
      </div>

      {savedMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{savedMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 space-y-6">
        {/* Profile Photos Preview & Upload */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Profile Photographs (Google Drive Storage)
          </label>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img
                src={photos[0] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                alt="Primary profile"
                className="w-24 h-24 rounded-2xl object-cover border-2 border-rose-500 shadow-sm"
              />
              <label className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[10px] font-bold">
                <Camera className="w-5 h-5 mb-0.5" />
                Change
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {photos[1] && (
              <img
                src={photos[1]}
                alt="Secondary profile"
                className="w-24 h-24 rounded-2xl object-cover border border-slate-200"
              />
            )}
            <label className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-rose-300 flex flex-col items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer transition-colors text-xs font-semibold">
              <Camera className="w-5 h-5 mb-1" />
              {uploading ? 'Uploading...' : 'Upload'}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            label="Height (cm)"
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <Input
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Relationship Goal
          </label>
          <select
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
          >
            <option value="serious_relationship">Serious Relationship</option>
            <option value="marriage">Marriage</option>
            <option value="friendship">Friendship & Dating</option>
            <option value="casual_dating">Casual Dating</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            About You (Bio)
          </label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Contact Sharing Consent Toggle */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900">Direct Contact Sharing Consent</span>
            <p className="text-[11px] text-slate-500">
              Allow mutual matches to request and unlock your verified phone number.
            </p>
          </div>
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
          />
        </div>

        <Button type="submit" className="w-full py-3">
          Save Profile Changes
        </Button>
      </form>
    </div>
  );
};
