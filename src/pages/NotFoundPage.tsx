import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl text-muted-foreground">{t('common.notFound')}</p>
      <Link to="/" className="text-primary hover:underline">
        {t('nav.home')}
      </Link>
    </div>
  );
}
