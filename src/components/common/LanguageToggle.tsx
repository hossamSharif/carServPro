import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-2 py-1 text-sm font-medium hover:bg-accent rounded-md transition-colors"
      aria-label="Toggle language"
    >
      {i18n.language === 'ar' ? 'EN' : 'عربي'}
    </button>
  );
}
