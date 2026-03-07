import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MessageCircle, MapPin, Phone, Clock } from 'lucide-react';

interface FooterProps {
  whatsappNumber?: string;
  businessPhone?: string;
}

export default function Footer({ whatsappNumber = '', businessPhone = '' }: FooterProps) {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/5 bg-[hsl(240,20%,3.5%)]">
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-gold mb-2">
              كار سيرف برو
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
              {t('footer.quickLinks')}
            </h4>
            <nav className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-white/40 hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <Link to="/services" className="text-sm text-white/40 hover:text-primary transition-colors">
                {t('nav.services')}
              </Link>
              <Link to="/login" className="text-sm text-white/40 hover:text-primary transition-colors">
                {t('auth.login')}
              </Link>
              <Link to="/register" className="text-sm text-white/40 hover:text-primary transition-colors">
                {t('auth.register')}
              </Link>
            </nav>
          </div>

          {/* Working Hours */}
          <div>
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
              {t('footer.workingHoursTitle')}
            </h4>
            <div className="flex flex-col gap-2 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{t('footer.workingHoursValue')}</span>
              </div>
              <span className="ps-6">{t('footer.fridayClosed')}</span>
              <span className="ps-6">{t('footer.saturdayHours')}</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
              {t('footer.contactUs')}
            </h4>
            <div className="flex flex-col gap-3 text-sm text-white/40">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span dir="ltr">{businessPhone || '+966 XX XXX XXXX'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{t('footer.location')}</span>
              </div>
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, '')}?text=${encodeURIComponent('مرحبا')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-400 hover:text-green-300 transition-colors"
              >
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/5 text-center text-xs text-white/25">
          &copy; {new Date().getFullYear()} CarServ Pro. {t('footer.rights')}.
        </div>
      </div>
    </footer>
  );
}
