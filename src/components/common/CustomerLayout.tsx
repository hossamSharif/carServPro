import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Menu, X, User, LogOut, MessageCircle, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getBusinessProfile } from '@/services/settingsService';
import LanguageToggle from './LanguageToggle';
import Footer from '@/components/customer/Footer';
import logoImg from '@/images/logoediti.png';

export default function CustomerLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { isOnline } = useOnlineStatus();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');

  useEffect(() => {
    getBusinessProfile().then((profile) => {
      if (profile) {
        setWhatsappNumber(profile.whatsappNumber || '');
        setBusinessPhone(profile.phone || '');
      }
    });
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gold">
            <img src={logoImg} alt="Smart Operation" className="h-9 w-9 object-contain" />
            <span>Smart Operation</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/services" className="text-sm hover:text-primary transition-colors">
              {t('nav.services')}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <LanguageToggle />

            <Link to="/services" className="relative p-2 hover:bg-accent rounded-md">
              <ShoppingCart className="h-5 w-5" />
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isAdmin ? (
                  <Link to="/admin" className="text-sm px-3 py-2 bg-primary text-primary-foreground rounded-md">
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <Link to="/profile" className="p-2 hover:bg-accent rounded-md">
                    <User className="h-5 w-5" />
                  </Link>
                )}
                <button onClick={handleLogout} className="p-2 hover:bg-accent rounded-md">
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="text-sm px-3 py-2 hover:bg-accent rounded-md">
                  {t('auth.login')}
                </Link>
                <Link to="/register" className="text-sm px-3 py-2 bg-primary text-primary-foreground rounded-md">
                  {t('auth.register')}
                </Link>
              </div>
            )}

            <button
              className="md:hidden p-2 hover:bg-accent rounded-md"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background p-4 space-y-2">
            <Link to="/" className="block px-3 py-2 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.home')}
            </Link>
            <Link to="/services" className="block px-3 py-2 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
              {t('nav.services')}
            </Link>
            {!isAuthenticated && (
              <>
                <Link to="/login" className="block px-3 py-2 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  {t('auth.login')}
                </Link>
                <Link to="/register" className="block px-3 py-2 rounded-md hover:bg-accent" onClick={() => setMobileMenuOpen(false)}>
                  {t('auth.register')}
                </Link>
              </>
            )}
          </div>
        )}
      </header>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-950 text-center text-sm py-1 px-4 flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          {t('common.loading')}
        </div>
      )}

      {/* Main */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer whatsappNumber={whatsappNumber} businessPhone={businessPhone} />

      {/* WhatsApp FAB */}
      <a
        href={`https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent('مرحبا، أود الاستفسار')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 start-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-colors"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}
