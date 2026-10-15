import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useWallet } from '../../contexts/WalletContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';
import {
  Heart,
  MessageCircle,
  Compass,
  Wallet,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Globe,
  Bell,
  Volume2,
  VolumeX,
  Flame,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { language, setLanguage, t, availableLanguages } = useLanguage();
  const { balance } = useWallet();
  const { unreadCount, soundEnabled, setSoundEnabled } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-rose-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-violet-600 flex items-center justify-center shadow-md shadow-rose-200 group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-600 via-rose-500 to-violet-600 bg-clip-text text-transparent">
                Kunda Space
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-1">
                {t('brand.tagline')}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/') ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  to="/how-it-works"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/how-it-works') ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  {t('nav.howItWorks')}
                </Link>
                <Link
                  to="/membership"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/membership') ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  {t('nav.membership')}
                </Link>
                <Link
                  to="/safety"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/safety') ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  {t('nav.safety')}
                </Link>
                <Link
                  to="/faq"
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/faq') ? 'text-rose-600 bg-rose-50' : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  {t('nav.faq')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/dashboard/discover"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/dashboard/discover')
                      ? 'text-rose-600 bg-rose-50'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  {t('nav.discover')}
                </Link>
                <Link
                  to="/dashboard/feed"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/dashboard/feed')
                      ? 'text-rose-600 bg-rose-50'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <Flame className="w-4 h-4 text-rose-500" />
                  Feed
                </Link>
                <Link
                  to="/dashboard/matches"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/dashboard/matches')
                      ? 'text-rose-600 bg-rose-50'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  {t('nav.matches')}
                </Link>
                <Link
                  to="/dashboard/messages"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                    isActive('/dashboard/messages')
                      ? 'text-rose-600 bg-rose-50'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {t('nav.messages')}
                </Link>
                <Link
                  to="/dashboard/wallet"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive('/dashboard/wallet')
                      ? 'text-rose-600 bg-rose-50'
                      : 'text-slate-600 hover:text-rose-600'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>{balance.toLocaleString()} RWF</span>
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Right actions: Lang switcher + Sound toggle + Auth buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sound alert toggle */}
            {isAuthenticated && (
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Mute notification sound' : 'Enable notification sound'}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-500" /> : <VolumeX className="w-4 h-4" />}
              </button>
            )}

            {/* Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <span>{availableLanguages[language].flag}</span>
                <span>{availableLanguages[language].label}</span>
              </button>

              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 animate-in fade-in zoom-in-95">
                  {(Object.keys(availableLanguages) as Array<keyof typeof availableLanguages>).map((code) => (
                    <button
                      key={code}
                      onClick={() => {
                        setLanguage(code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left hover:bg-rose-50 ${
                        language === code ? 'text-rose-600 bg-rose-50/50 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <span>{availableLanguages[code].flag}</span>
                      <span>{availableLanguages[code].label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/auth/login">
                  <Button variant="ghost" size="sm">
                    {t('nav.signIn')}
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button variant="primary" size="sm">
                    {t('nav.join')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/dashboard/profile">
                  <button className="flex items-center gap-1.5 p-1.5 text-xs font-semibold text-slate-700 hover:text-rose-600 rounded-xl hover:bg-slate-50">
                    <User className="w-4 h-4" />
                    <span>{user?.email?.split('@')[0]}</span>
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pt-2 pb-6 space-y-3">
          {!isAuthenticated ? (
            <div className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg"
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg"
              >
                {t('nav.howItWorks')}
              </Link>
              <Link
                to="/membership"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg"
              >
                {t('nav.membership')}
              </Link>
              <Link
                to="/safety"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg"
              >
                {t('nav.safety')}
              </Link>
              <Link
                to="/faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg"
              >
                {t('nav.faq')}
              </Link>
              <div className="pt-2 flex flex-col gap-2">
                <Link to="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    {t('nav.signIn')}
                  </Button>
                </Link>
                <Link to="/auth/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    {t('nav.join')}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Link
                to="/dashboard/discover"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <Compass className="w-4 h-4 text-rose-500" /> {t('nav.discover')}
              </Link>
              <Link
                to="/dashboard/feed"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <Flame className="w-4 h-4 text-rose-500" /> Feed
              </Link>
              <Link
                to="/dashboard/matches"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <Heart className="w-4 h-4 text-rose-500" /> {t('nav.matches')}
              </Link>
              <Link
                to="/dashboard/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-rose-500" /> {t('nav.messages')}
              </Link>
              <Link
                to="/dashboard/wallet"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <Wallet className="w-4 h-4 text-emerald-600" /> {t('nav.wallet')} ({balance.toLocaleString()} RWF)
              </Link>
              <Link
                to="/dashboard/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 px-3 text-sm font-medium text-slate-700 hover:bg-rose-50 rounded-lg flex items-center gap-2"
              >
                <User className="w-4 h-4 text-slate-500" /> {t('nav.profile')}
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 px-3 text-sm font-semibold text-violet-700 bg-violet-50 rounded-lg flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" /> Admin Portal
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="py-2 px-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg text-left flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" /> {t('nav.logout')}
              </button>
            </div>
          )}

          {/* Mobile Language Switcher */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Language:</span>
            <div className="flex gap-1.5">
              {(Object.keys(availableLanguages) as Array<keyof typeof availableLanguages>).map((code) => (
                <button
                  key={code}
                  onClick={() => setLanguage(code)}
                  className={`px-2 py-1 text-xs font-semibold rounded-lg border ${
                    language === code ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {availableLanguages[code].flag} {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
